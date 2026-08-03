'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  createInteractionSchema,
  updateInteractionSchema,
  type CreateInteractionInput,
  type UpdateInteractionInput,
} from '@/lib/validations/interaction'

/**
 * Type de retour pour les actions d'interactions
 */
type ActionResult<T = void> = {
  success: boolean
  error?: string
  data?: T
}

/**
 * Créer une nouvelle interaction
 * Le trigger de la base de données mettra automatiquement à jour last_interaction_at
 */
export async function createInteraction(
  data: CreateInteractionInput
): Promise<ActionResult<{ id: string }>> {
  try {
    // Validation
    const validated = createInteractionSchema.parse(data)

    const supabase = await createClient()

    // Récupérer l'utilisateur connecté
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Vous devez être connecté pour créer une interaction',
      }
    }

    // Vérifier que le contact appartient à l'utilisateur
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id')
      .eq('id', validated.contactId)
      .eq('user_id', user.id)
      .single()

    if (contactError || !contact) {
      return {
        success: false,
        error: 'Contact introuvable',
      }
    }

    // Mapper les champs camelCase vers snake_case
    const insertData = {
      user_id: user.id,
      contact_id: validated.contactId,
      type: validated.type,
      channel: validated.channel || null,
      occurred_at: validated.occurredAt.toISOString(),
      content: validated.content || null,
      duration: validated.duration || null,
      direction: validated.direction || null,
    }

    // Insérer l'interaction
    const { data: interactionData, error: insertError } = await supabase
      .from('interactions')
      .insert(insertData as never)
      .select('id')
      .single()

    if (insertError || !interactionData) {
      return {
        success: false,
        error: 'Impossible de créer l\'interaction',
      }
    }

    revalidatePath(`/contacts/${validated.contactId}`)
    revalidatePath('/contacts')

    return {
      success: true,
      data: { id: (interactionData as { id: string }).id },
    }
  } catch (error) {
    console.error('Create interaction error:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la création de l\'interaction',
    }
  }
}

/**
 * Mettre à jour une interaction existante
 */
export async function updateInteraction(
  interactionId: string,
  data: UpdateInteractionInput
): Promise<ActionResult> {
  try {
    // Validation
    const validated = updateInteractionSchema.parse(data)

    const supabase = await createClient()

    // Récupérer l'utilisateur connecté
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Vous devez être connecté pour modifier une interaction',
      }
    }

    // Vérifier que l'interaction existe et appartient à l'utilisateur
    const { data: existingInteraction, error: fetchError } = await supabase
      .from('interactions')
      .select('id, contact_id')
      .eq('id', interactionId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingInteraction) {
      return {
        success: false,
        error: 'Interaction introuvable',
      }
    }

    // Mapper les champs camelCase vers snake_case
    const updateData: Record<string, unknown> = {}
    if (validated.type !== undefined) {
      updateData.type = validated.type
    }
    if (validated.channel !== undefined) {
      updateData.channel = validated.channel
    }
    if (validated.occurredAt !== undefined) {
      updateData.occurred_at = validated.occurredAt.toISOString()
    }
    if (validated.content !== undefined) {
      updateData.content = validated.content
    }
    if (validated.duration !== undefined) {
      updateData.duration = validated.duration
    }
    if (validated.direction !== undefined) {
      updateData.direction = validated.direction
    }

    // Mettre à jour l'interaction
    const { error: updateError } = await supabase
      .from('interactions')
      .update(updateData as never)
      .eq('id', interactionId)
      .eq('user_id', user.id)

    if (updateError) {
      return {
        success: false,
        error: 'Impossible de mettre à jour l\'interaction',
      }
    }

    const contactId = (existingInteraction as { contact_id: string }).contact_id
    revalidatePath(`/contacts/${contactId}`)

    return {
      success: true,
    }
  } catch (error) {
    console.error('Update interaction error:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la mise à jour de l\'interaction',
    }
  }
}

/**
 * Supprimer une interaction
 */
export async function deleteInteraction(interactionId: string): Promise<ActionResult> {
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
        error: 'Vous devez être connecté pour supprimer une interaction',
      }
    }

    // Récupérer l'interaction pour obtenir le contact_id avant suppression
    const { data: interaction, error: fetchError } = await supabase
      .from('interactions')
      .select('contact_id')
      .eq('id', interactionId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !interaction) {
      return {
        success: false,
        error: 'Interaction introuvable',
      }
    }

    // Supprimer l'interaction
    const { error: deleteError } = await supabase
      .from('interactions')
      .delete()
      .eq('id', interactionId)
      .eq('user_id', user.id)

    if (deleteError) {
      return {
        success: false,
        error: 'Impossible de supprimer l\'interaction',
      }
    }

    const contactId = (interaction as { contact_id: string }).contact_id
    revalidatePath(`/contacts/${contactId}`)

    return {
      success: true,
    }
  } catch (error) {
    console.error('Delete interaction error:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la suppression de l\'interaction',
    }
  }
}
