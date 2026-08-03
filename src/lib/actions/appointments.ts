'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  type CreateAppointmentInput,
  type UpdateAppointmentInput,
} from '@/lib/validations/appointment'

/**
 * Type de retour pour les actions de rendez-vous
 */
type ActionResult<T = void> = {
  success: boolean
  error?: string
  data?: T
}

/**
 * Créer un nouveau rendez-vous
 */
export async function createAppointment(
  data: CreateAppointmentInput
): Promise<ActionResult<{ id: string }>> {
  try {
    // Validation
    const validated = createAppointmentSchema.parse(data)

    const supabase = await createClient()

    // Récupérer l'utilisateur connecté
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Vous devez être connecté pour créer un rendez-vous',
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
      title: validated.title,
      start_at: validated.startAt.toISOString(),
      end_at: validated.endAt ? validated.endAt.toISOString() : null,
      location: validated.location || null,
      status: validated.status,
      notes: validated.notes || null,
      reminder_at: validated.reminderAt ? validated.reminderAt.toISOString() : null,
    }

    // Insérer le rendez-vous
    const { data: appointmentData, error: insertError } = await supabase
      .from('appointments')
      .insert(insertData as never)
      .select('id')
      .single()

    if (insertError || !appointmentData) {
      return {
        success: false,
        error: 'Impossible de créer le rendez-vous',
      }
    }

    revalidatePath('/appointments')
    revalidatePath(`/contacts/${validated.contactId}`)

    return {
      success: true,
      data: { id: (appointmentData as { id: string }).id },
    }
  } catch (error) {
    console.error('Create appointment error:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la création du rendez-vous',
    }
  }
}

/**
 * Mettre à jour un rendez-vous existant
 */
export async function updateAppointment(
  appointmentId: string,
  data: UpdateAppointmentInput
): Promise<ActionResult> {
  try {
    // Validation
    const validated = updateAppointmentSchema.parse(data)

    const supabase = await createClient()

    // Récupérer l'utilisateur connecté
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Vous devez être connecté pour modifier un rendez-vous',
      }
    }

    // Vérifier que le rendez-vous existe et appartient à l'utilisateur
    const { data: existingAppointment, error: fetchError } = await supabase
      .from('appointments')
      .select('id, contact_id')
      .eq('id', appointmentId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingAppointment) {
      return {
        success: false,
        error: 'Rendez-vous introuvable',
      }
    }

    // Mapper les champs camelCase vers snake_case
    const updateData: Record<string, unknown> = {}
    if (validated.title !== undefined) {
      updateData.title = validated.title
    }
    if (validated.startAt !== undefined) {
      updateData.start_at = validated.startAt.toISOString()
    }
    if (validated.endAt !== undefined) {
      updateData.end_at = validated.endAt ? validated.endAt.toISOString() : null
    }
    if (validated.location !== undefined) {
      updateData.location = validated.location
    }
    if (validated.status !== undefined) {
      updateData.status = validated.status
    }
    if (validated.notes !== undefined) {
      updateData.notes = validated.notes
    }
    if (validated.reminderAt !== undefined) {
      updateData.reminder_at = validated.reminderAt ? validated.reminderAt.toISOString() : null
    }

    // Mettre à jour le rendez-vous
    const { error: updateError } = await supabase
      .from('appointments')
      .update(updateData as never)
      .eq('id', appointmentId)
      .eq('user_id', user.id)

    if (updateError) {
      return {
        success: false,
        error: 'Impossible de mettre à jour le rendez-vous',
      }
    }

    const contactId = (existingAppointment as { contact_id: string }).contact_id
    revalidatePath('/appointments')
    revalidatePath(`/contacts/${contactId}`)

    return {
      success: true,
    }
  } catch (error) {
    console.error('Update appointment error:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la mise à jour du rendez-vous',
    }
  }
}

/**
 * Supprimer un rendez-vous
 */
export async function deleteAppointment(appointmentId: string): Promise<ActionResult> {
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
        error: 'Vous devez être connecté pour supprimer un rendez-vous',
      }
    }

    // Récupérer le rendez-vous pour obtenir le contact_id avant suppression
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('contact_id')
      .eq('id', appointmentId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !appointment) {
      return {
        success: false,
        error: 'Rendez-vous introuvable',
      }
    }

    // Supprimer le rendez-vous
    const { error: deleteError } = await supabase
      .from('appointments')
      .delete()
      .eq('id', appointmentId)
      .eq('user_id', user.id)

    if (deleteError) {
      return {
        success: false,
        error: 'Impossible de supprimer le rendez-vous',
      }
    }

    const contactId = (appointment as { contact_id: string }).contact_id
    revalidatePath('/appointments')
    revalidatePath(`/contacts/${contactId}`)

    return {
      success: true,
    }
  } catch (error) {
    console.error('Delete appointment error:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la suppression du rendez-vous',
    }
  }
}

/**
 * Mettre à jour uniquement le statut d'un rendez-vous
 */
export async function updateAppointmentStatus(
  appointmentId: string,
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
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

    // Récupérer le rendez-vous pour obtenir le contact_id
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('contact_id')
      .eq('id', appointmentId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !appointment) {
      return {
        success: false,
        error: 'Rendez-vous introuvable',
      }
    }

    // Mettre à jour le statut
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ status } as never)
      .eq('id', appointmentId)
      .eq('user_id', user.id)

    if (updateError) {
      return {
        success: false,
        error: 'Impossible de mettre à jour le statut',
      }
    }

    const contactId = (appointment as { contact_id: string }).contact_id
    revalidatePath('/appointments')
    revalidatePath(`/contacts/${contactId}`)

    return {
      success: true,
    }
  } catch (error) {
    console.error('Update appointment status error:', error)
    return {
      success: false,
      error: 'Une erreur est survenue',
    }
  }
}
