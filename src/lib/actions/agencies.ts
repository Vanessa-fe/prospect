'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  createAgencySchema,
  updateAgencySchema,
  normalizeWebsite,
  type CreateAgencyInput,
  type UpdateAgencyInput,
} from '@/lib/validations/agency'

/**
 * Type de retour pour les actions d'agences
 */
type ActionResult<T = void> = {
  success: boolean
  error?: string
  data?: T
}

type DuplicateAgency = {
  id: string
  name: string
  website: string | null
}

/**
 * Créer une nouvelle agence
 */
export async function createAgency(
  data: CreateAgencyInput
): Promise<ActionResult<{ id: string }>> {
  try {
    // Validation
    const validated = createAgencySchema.parse(data)

    const supabase = await createClient()

    // Récupérer l'utilisateur connecté
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Vous devez être connecté pour créer une agence',
      }
    }

    // Vérifier les doublons si un site web est fourni (avertissement, pas un blocage strict)
    if (validated.website) {
      const duplicates = await checkDuplicates(user.id, validated.website)

      if (duplicates.length > 0) {
        const duplicate = duplicates[0]
        if (duplicate) {
          return {
            success: false,
            error: `Une agence similaire existe déjà : ${duplicate.name}`,
            data: { id: duplicate.id },
          }
        }
      }
    }

    // Mapper les champs camelCase vers snake_case
    const insertData = {
      user_id: user.id,
      name: validated.name,
      website: validated.website || null,
      city: validated.city || null,
      size_range: validated.sizeRange || null,
      signal_type: validated.signalType || null,
      signal_url: validated.signalUrl || null,
      signal_detected_at: validated.signalType ? new Date().toISOString() : null,
      contact_name: validated.contactName || null,
      contact_role: validated.contactRole || null,
      contact_email: validated.contactEmail || null,
      contact_phone: validated.contactPhone || null,
      preferred_channel: validated.preferredChannel || null,
      status_id: validated.statusId || null,
      source_id: validated.sourceId || null,
      notes: validated.notes || null,
      detected_stack: validated.detectedStack || [],
      stack_detected_at: validated.detectedStack && validated.detectedStack.length > 0
        ? new Date().toISOString()
        : null,
    }

    // Insérer l'agence
    const { data: agencyData, error: insertError } = await supabase
      .from('agencies')
      .insert(insertData as never)
      .select('id')
      .single()

    if (insertError || !agencyData) {
      return {
        success: false,
        error: 'Impossible de créer l\'agence',
      }
    }

    revalidatePath('/agencies')

    return {
      success: true,
      data: { id: (agencyData as { id: string }).id },
    }
  } catch (error) {
    console.error('Create agency error:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la création de l\'agence',
    }
  }
}

/**
 * Mettre à jour une agence existante
 */
export async function updateAgency(
  agencyId: string,
  data: UpdateAgencyInput
): Promise<ActionResult> {
  try {
    // Validation
    const validated = updateAgencySchema.parse(data)

    const supabase = await createClient()

    // Récupérer l'utilisateur connecté
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Vous devez être connecté pour modifier une agence',
      }
    }

    // Vérifier que l'agence existe et appartient à l'utilisateur
    const { data: existingAgency, error: fetchError } = await supabase
      .from('agencies')
      .select('id')
      .eq('id', agencyId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingAgency) {
      return {
        success: false,
        error: 'Agence introuvable',
      }
    }

    // Vérifier les doublons si le site web est modifié
    if (validated.website) {
      const duplicates = await checkDuplicates(user.id, validated.website, agencyId)

      if (duplicates.length > 0) {
        const duplicate = duplicates[0]
        if (duplicate) {
          return {
            success: false,
            error: `Une agence similaire existe déjà : ${duplicate.name}`,
          }
        }
      }
    }

    // Mapper les champs camelCase vers snake_case
    const updateData: Record<string, unknown> = {}
    if (validated.name !== undefined) {
      updateData.name = validated.name
    }
    if (validated.website !== undefined) {
      updateData.website = validated.website
    }
    if (validated.city !== undefined) {
      updateData.city = validated.city
    }
    if (validated.sizeRange !== undefined) {
      updateData.size_range = validated.sizeRange
    }
    if (validated.signalType !== undefined) {
      updateData.signal_type = validated.signalType
    }
    if (validated.signalUrl !== undefined) {
      updateData.signal_url = validated.signalUrl
    }
    if (validated.contactName !== undefined) {
      updateData.contact_name = validated.contactName
    }
    if (validated.contactRole !== undefined) {
      updateData.contact_role = validated.contactRole
    }
    if (validated.contactEmail !== undefined) {
      updateData.contact_email = validated.contactEmail
    }
    if (validated.contactPhone !== undefined) {
      updateData.contact_phone = validated.contactPhone
    }
    if (validated.preferredChannel !== undefined) {
      updateData.preferred_channel = validated.preferredChannel
    }
    if (validated.statusId !== undefined) {
      updateData.status_id = validated.statusId
    }
    if (validated.sourceId !== undefined) {
      updateData.source_id = validated.sourceId
    }
    if (validated.notes !== undefined) {
      updateData.notes = validated.notes
    }
    if (validated.detectedStack !== undefined) {
      updateData.detected_stack = validated.detectedStack
      updateData.stack_detected_at = new Date().toISOString()
    }

    // Mettre à jour l'agence
    const { error: updateError } = await supabase
      .from('agencies')
      .update(updateData as never)
      .eq('id', agencyId)
      .eq('user_id', user.id)

    if (updateError) {
      return {
        success: false,
        error: 'Impossible de mettre à jour l\'agence',
      }
    }

    revalidatePath('/agencies')
    revalidatePath(`/agencies/${agencyId}`)

    return {
      success: true,
    }
  } catch (error) {
    console.error('Update agency error:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la mise à jour de l\'agence',
    }
  }
}

/**
 * Supprimer une agence
 */
export async function deleteAgency(agencyId: string): Promise<ActionResult> {
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
        error: 'Vous devez être connecté pour supprimer une agence',
      }
    }

    // Supprimer l'agence (les données liées seront supprimées en cascade)
    const { error: deleteError } = await supabase
      .from('agencies')
      .delete()
      .eq('id', agencyId)
      .eq('user_id', user.id)

    if (deleteError) {
      return {
        success: false,
        error: 'Impossible de supprimer l\'agence',
      }
    }

    revalidatePath('/agencies')

    return {
      success: true,
    }
  } catch (error) {
    console.error('Delete agency error:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la suppression de l\'agence',
    }
  }
}

/**
 * Mettre à jour le statut d'une agence
 */
export async function updateAgencyStatus(
  agencyId: string,
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
      .from('agencies')
      .update({ status_id: statusId } as never)
      .eq('id', agencyId)
      .eq('user_id', user.id)

    if (updateError) {
      return {
        success: false,
        error: 'Impossible de mettre à jour le statut',
      }
    }

    revalidatePath('/agencies')
    revalidatePath(`/agencies/${agencyId}`)

    return {
      success: true,
    }
  } catch (error) {
    console.error('Update agency status error:', error)
    return {
      success: false,
      error: 'Une erreur est survenue',
    }
  }
}

/**
 * Mettre à jour la stack détectée d'une agence (appelé après "Analyser le site")
 */
export async function updateAgencyDetectedStack(
  agencyId: string,
  detectedStack: string[],
  stackEvidence: Record<string, string[]>
): Promise<ActionResult> {
  try {
    const supabase = await createClient()

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

    const { error: updateError } = await supabase
      .from('agencies')
      .update({
        detected_stack: detectedStack,
        stack_evidence: stackEvidence,
        stack_detected_at: new Date().toISOString(),
      } as never)
      .eq('id', agencyId)
      .eq('user_id', user.id)

    if (updateError) {
      return {
        success: false,
        error: 'Impossible de mettre à jour la stack détectée',
      }
    }

    revalidatePath(`/agencies/${agencyId}`)

    return {
      success: true,
    }
  } catch (error) {
    console.error('Update agency detected stack error:', error)
    return {
      success: false,
      error: 'Une erreur est survenue',
    }
  }
}

/**
 * Fonction utilitaire pour vérifier les doublons (par site web normalisé)
 */
async function checkDuplicates(
  userId: string,
  website?: string | null,
  excludeAgencyId?: string
): Promise<DuplicateAgency[]> {
  const supabase = await createClient()

  if (!website) {
    return []
  }

  const normalized = normalizeWebsite(website)
  if (!normalized) {
    return []
  }

  let query = supabase
    .from('agencies')
    .select('id, name, website')
    .eq('user_id', userId)
    .not('website', 'is', null)

  if (excludeAgencyId) {
    query = query.neq('id', excludeAgencyId)
  }

  const { data, error } = await query.limit(50)

  if (error || !data) {
    return []
  }

  // Comparaison côté application via normalizeWebsite (pas d'équivalent SQL simple ici)
  return (data as DuplicateAgency[]).filter((agency) => {
    if (!agency.website) return false
    return normalizeWebsite(agency.website) === normalized
  })
}
