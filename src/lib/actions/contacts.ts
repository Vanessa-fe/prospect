'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  createContactSchema,
  updateContactSchema,
  createContactChannelSchema,
  type CreateContactInput,
  type UpdateContactInput,
  type CreateContactChannelInput,
} from '@/lib/validations/contact'

/**
 * Type de retour pour les actions de contacts
 */
type ActionResult<T = void> = {
  success: boolean
  error?: string
  data?: T
}

type DuplicateContact = {
  id: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  email: string | null
}

/**
 * Créer un nouveau contact
 */
export async function createContact(
  data: CreateContactInput
): Promise<ActionResult<{ id: string }>> {
  try {
    // Validation
    const validated = createContactSchema.parse(data)

    const supabase = await createClient()

    // Récupérer l'utilisateur connecté
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Vous devez être connecté pour créer un contact',
      }
    }

    // Vérifier les doublons si téléphone ou email fourni
    if (validated.phone || validated.email) {
      const duplicates = await checkDuplicates(
        user.id,
        validated.phone,
        validated.email
      )

      if (duplicates.length > 0) {
        const duplicate = duplicates[0]
        if (duplicate) {
          const name = [duplicate.first_name, duplicate.last_name]
            .filter(Boolean)
            .join(' ')
          return {
            success: false,
            error: `Un contact similaire existe déjà : ${name || 'Sans nom'}`,
            data: { id: duplicate.id },
          }
        }
      }
    }

    // Mapper les champs camelCase vers snake_case
    const insertData = {
      user_id: user.id,
      first_name: validated.firstName,
      last_name: validated.lastName || null,
      nickname: validated.nickname || null,
      phone: validated.phone || null,
      email: validated.email || null,
      age: validated.age || null,
      city: validated.city || null,
      source_id: validated.sourceId || null,
      status_id: validated.statusId || null,
      favorite: validated.favorite,
      risk_level: validated.riskLevel,
      notes: validated.notes || null,
    }

    // Insérer le contact
    const { data: contactData, error: insertError } = await supabase
      .from('contacts')
      .insert(insertData as never)
      .select('id')
      .single()

    if (insertError || !contactData) {
      return {
        success: false,
        error: 'Impossible de créer le contact',
      }
    }

    revalidatePath('/contacts')

    return {
      success: true,
      data: { id: (contactData as { id: string }).id },
    }
  } catch (error) {
    console.error('Create contact error:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la création du contact',
    }
  }
}

/**
 * Mettre à jour un contact existant
 */
export async function updateContact(
  contactId: string,
  data: UpdateContactInput
): Promise<ActionResult> {
  try {
    // Validation
    const validated = updateContactSchema.parse(data)

    const supabase = await createClient()

    // Récupérer l'utilisateur connecté
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Vous devez être connecté pour modifier un contact',
      }
    }

    // Vérifier que le contact existe et appartient à l'utilisateur
    const { data: existingContact, error: fetchError } = await supabase
      .from('contacts')
      .select('id')
      .eq('id', contactId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingContact) {
      return {
        success: false,
        error: 'Contact introuvable',
      }
    }

    // Vérifier les doublons si téléphone ou email modifié
    if (validated.phone || validated.email) {
      const duplicates = await checkDuplicates(
        user.id,
        validated.phone,
        validated.email,
        contactId // Exclure le contact en cours de modification
      )

      if (duplicates.length > 0) {
        const duplicate = duplicates[0]
        if (duplicate) {
          const name = [duplicate.first_name, duplicate.last_name]
            .filter(Boolean)
            .join(' ')
          return {
            success: false,
            error: `Un contact similaire existe déjà : ${name || 'Sans nom'}`,
          }
        }
      }
    }

    // Mapper les champs camelCase vers snake_case
    const updateData: Record<string, unknown> = {}
    if (validated.firstName !== undefined) {
      updateData.first_name = validated.firstName
    }
    if (validated.lastName !== undefined) {
      updateData.last_name = validated.lastName
    }
    if (validated.nickname !== undefined) {
      updateData.nickname = validated.nickname
    }
    if (validated.phone !== undefined) {
      updateData.phone = validated.phone
    }
    if (validated.email !== undefined) {
      updateData.email = validated.email
    }
    if (validated.age !== undefined) {
      updateData.age = validated.age
    }
    if (validated.city !== undefined) {
      updateData.city = validated.city
    }
    if (validated.sourceId !== undefined) {
      updateData.source_id = validated.sourceId
    }
    if (validated.statusId !== undefined) {
      updateData.status_id = validated.statusId
    }
    if (validated.favorite !== undefined) {
      updateData.favorite = validated.favorite
    }
    if (validated.riskLevel !== undefined) {
      updateData.risk_level = validated.riskLevel
    }
    if (validated.notes !== undefined) {
      updateData.notes = validated.notes
    }

    // Mettre à jour le contact
    const { error: updateError } = await supabase
      .from('contacts')
      .update(updateData as never)
      .eq('id', contactId)
      .eq('user_id', user.id)

    if (updateError) {
      return {
        success: false,
        error: 'Impossible de mettre à jour le contact',
      }
    }

    revalidatePath('/contacts')
    revalidatePath(`/contacts/${contactId}`)

    return {
      success: true,
    }
  } catch (error) {
    console.error('Update contact error:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la mise à jour du contact',
    }
  }
}

/**
 * Supprimer un contact
 */
export async function deleteContact(contactId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Récupérer l'utilisateur connecté
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Vous devez être connecté pour supprimer un contact',
      }
    }

    // Supprimer le contact (les données liées seront supprimées en cascade)
    const { error: deleteError } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contactId)
      .eq('user_id', user.id)

    if (deleteError) {
      return {
        success: false,
        error: 'Impossible de supprimer le contact',
      }
    }

    revalidatePath('/contacts')

    return {
      success: true,
    }
  } catch (error) {
    console.error('Delete contact error:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la suppression du contact',
    }
  }
}

/**
 * Mettre à jour le statut d'un contact
 */
export async function updateContactStatus(
  contactId: string,
  statusId: string | null
): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Récupérer l'utilisateur connecté
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Vous devez être connecté',
      }
    }

    // Mettre à jour le statut
    const { error: updateError } = await supabase
      .from('contacts')
      .update({ status_id: statusId } as never)
      .eq('id', contactId)
      .eq('user_id', user.id)

    if (updateError) {
      return {
        success: false,
        error: 'Impossible de mettre à jour le statut',
      }
    }

    revalidatePath('/contacts')
    revalidatePath(`/contacts/${contactId}`)

    return {
      success: true,
    }
  } catch (error) {
    console.error('Update contact status error:', error)
    return {
      success: false,
      error: 'Une erreur est survenue',
    }
  }
}

/**
 * Marquer/démarquer un contact comme favori
 */
export async function toggleFavorite(
  contactId: string,
  favorite: boolean
): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Récupérer l'utilisateur connecté
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Vous devez être connecté',
      }
    }

    // Mettre à jour le favori
    const { error: updateError } = await supabase
      .from('contacts')
      .update({ favorite } as never)
      .eq('id', contactId)
      .eq('user_id', user.id)

    if (updateError) {
      return {
        success: false,
        error: 'Impossible de mettre à jour le favori',
      }
    }

    revalidatePath('/contacts')
    revalidatePath(`/contacts/${contactId}`)

    return {
      success: true,
    }
  } catch (error) {
    console.error('Toggle favorite error:', error)
    return {
      success: false,
      error: 'Une erreur est survenue',
    }
  }
}

/**
 * Ajouter un canal de communication à un contact
 */
export async function addContactChannel(
  data: CreateContactChannelInput
): Promise<ActionResult> {
  try {
    // Validation
    const validated = createContactChannelSchema.parse(data)

    const supabase = await createClient()

    // Récupérer l'utilisateur connecté
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Vous devez être connecté',
      }
    }

    // Vérifier que le contact existe et appartient à l'utilisateur
    const { data: contact, error: fetchError } = await supabase
      .from('contacts')
      .select('id')
      .eq('id', validated.contactId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !contact) {
      return {
        success: false,
        error: 'Contact introuvable',
      }
    }

    // Insérer le canal
    const { error: insertError } = await supabase
      .from('contact_channels')
      .insert({
        contact_id: validated.contactId,
        channel_type: validated.channelType,
        username: validated.username || null,
        external_identifier: validated.externalIdentifier || null,
      } as never)

    if (insertError) {
      // Gérer l'erreur de doublon (UNIQUE constraint)
      if (insertError.code === '23505') {
        return {
          success: false,
          error: 'Ce canal existe déjà pour ce contact',
        }
      }
      return {
        success: false,
        error: 'Impossible d\'ajouter le canal',
      }
    }

    revalidatePath(`/contacts/${validated.contactId}`)

    return {
      success: true,
    }
  } catch (error) {
    console.error('Add contact channel error:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de l\'ajout du canal',
    }
  }
}

/**
 * Supprimer un canal de communication
 */
export async function deleteContactChannel(channelId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Récupérer l'utilisateur connecté
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Vous devez être connecté',
      }
    }

    // Récupérer le canal et vérifier la propriété via le contact
    const { data: channelData, error: fetchError } = await supabase
      .from('contact_channels')
      .select('contact_id, contacts!inner(user_id)')
      .eq('id', channelId)
      .single()

    if (fetchError || !channelData) {
      return {
        success: false,
        error: 'Canal introuvable',
      }
    }

    // Type assertion pour la jointure
    const channel = channelData as {
      contact_id: string
      contacts: { user_id: string }
    }

    if (channel.contacts.user_id !== user.id) {
      return {
        success: false,
        error: 'Non autorisé',
      }
    }

    // Supprimer le canal
    const { error: deleteError } = await supabase
      .from('contact_channels')
      .delete()
      .eq('id', channelId)

    if (deleteError) {
      return {
        success: false,
        error: 'Impossible de supprimer le canal',
      }
    }

    revalidatePath(`/contacts/${channel.contact_id}`)

    return {
      success: true,
    }
  } catch (error) {
    console.error('Delete contact channel error:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la suppression du canal',
    }
  }
}

/**
 * Fonction utilitaire pour vérifier les doublons
 */
async function checkDuplicates(
  userId: string,
  phone?: string | null,
  email?: string | null,
  excludeContactId?: string
): Promise<DuplicateContact[]> {
  const supabase = await createClient()

  // Si ni téléphone ni email, pas de vérification
  if (!phone && !email) {
    return []
  }

  // Construire la requête de recherche de doublons
  let query = supabase
    .from('contacts')
    .select('id, first_name, last_name, phone, email')
    .eq('user_id', userId)

  // Exclure le contact en cours de modification si spécifié
  if (excludeContactId) {
    query = query.neq('id', excludeContactId)
  }

  // Recherche par téléphone OU email
  if (phone && email) {
    query = query.or(`phone.eq.${phone},email.ilike.${email}`)
  } else if (phone) {
    query = query.eq('phone', phone)
  } else if (email) {
    query = query.ilike('email', email)
  }

  const { data, error } = await query.limit(5)

  if (error || !data) {
    return []
  }

  return data as DuplicateContact[]
}
