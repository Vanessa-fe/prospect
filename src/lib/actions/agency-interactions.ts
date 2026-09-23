'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  createAgencyInteractionSchema,
  updateAgencyInteractionSchema,
  type CreateAgencyInteractionInput,
  type UpdateAgencyInteractionInput,
} from '@/lib/validations/agency-interaction'

/**
 * Type de retour pour les actions d'interactions d'agences
 */
type ActionResult<T = void> = {
  success: boolean
  error?: string
  data?: T
}

/**
 * Créer une nouvelle interaction d'agence
 * Le trigger de la base de données mettra automatiquement à jour last_interaction_at
 */
export async function createAgencyInteraction(
  data: CreateAgencyInteractionInput
): Promise<ActionResult<{ id: string }>> {
  try {
    // Validation
    const validated = createAgencyInteractionSchema.parse(data)

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

    // Vérifier que l'agence appartient à l'utilisateur
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('id')
      .eq('id', validated.agencyId)
      .eq('user_id', user.id)
      .single()

    if (agencyError || !agency) {
      return {
        success: false,
        error: 'Agence introuvable',
      }
    }

    // Mapper les champs camelCase vers snake_case
    const insertData = {
      user_id: user.id,
      agency_id: validated.agencyId,
      type: validated.type,
      channel: validated.channel || null,
      occurred_at: validated.occurredAt.toISOString(),
      content: validated.content || null,
      duration: validated.duration || null,
      direction: validated.direction || null,
    }

    // Insérer l'interaction
    const { data: interactionData, error: insertError } = await supabase
      .from('agency_interactions')
      .insert(insertData as never)
      .select('id')
      .single()

    if (insertError || !interactionData) {
      return {
        success: false,
        error: 'Impossible de créer l\'interaction',
      }
    }

    revalidatePath(`/agencies/${validated.agencyId}`)
    revalidatePath('/agencies')

    return {
      success: true,
      data: { id: (interactionData as { id: string }).id },
    }
  } catch (error) {
    console.error('Create agency interaction error:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la création de l\'interaction',
    }
  }
}

/**
 * Mettre à jour une interaction d'agence existante
 */
export async function updateAgencyInteraction(
  interactionId: string,
  data: UpdateAgencyInteractionInput
): Promise<ActionResult> {
  try {
    // Validation
    const validated = updateAgencyInteractionSchema.parse(data)

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
      .from('agency_interactions')
      .select('id, agency_id')
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
      .from('agency_interactions')
      .update(updateData as never)
      .eq('id', interactionId)
      .eq('user_id', user.id)

    if (updateError) {
      return {
        success: false,
        error: 'Impossible de mettre à jour l\'interaction',
      }
    }

    const agencyId = (existingInteraction as { agency_id: string }).agency_id
    revalidatePath(`/agencies/${agencyId}`)

    return {
      success: true,
    }
  } catch (error) {
    console.error('Update agency interaction error:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la mise à jour de l\'interaction',
    }
  }
}

/**
 * Supprimer une interaction d'agence
 */
export async function deleteAgencyInteraction(interactionId: string): Promise<ActionResult> {
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

    // Récupérer l'interaction pour obtenir l'agency_id avant suppression
    const { data: interaction, error: fetchError } = await supabase
      .from('agency_interactions')
      .select('agency_id')
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
      .from('agency_interactions')
      .delete()
      .eq('id', interactionId)
      .eq('user_id', user.id)

    if (deleteError) {
      return {
        success: false,
        error: 'Impossible de supprimer l\'interaction',
      }
    }

    const agencyId = (interaction as { agency_id: string }).agency_id
    revalidatePath(`/agencies/${agencyId}`)

    return {
      success: true,
    }
  } catch (error) {
    console.error('Delete agency interaction error:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la suppression de l\'interaction',
    }
  }
}
