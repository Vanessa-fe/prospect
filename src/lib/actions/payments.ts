'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  createPaymentSchema,
  updatePaymentSchema,
  type CreatePaymentInput,
  type UpdatePaymentInput,
} from '@/lib/validations/payment'

type ActionResult<T = unknown> = {
  success: boolean
  data?: T
  error?: string
}

export async function createPayment(input: CreatePaymentInput): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Non authentifié' }
    }

    // Valider les données
    const validated = createPaymentSchema.parse(input)

    // Vérifier que le contact appartient à l'utilisateur
    const { data: contact } = await supabase
      .from('contacts')
      .select('id')
      .eq('id', validated.contactId)
      .eq('user_id', user.id)
      .single()

    if (!contact) {
      return { success: false, error: 'Contact non trouvé' }
    }

    // Si un appointment_id est fourni, vérifier qu'il appartient à l'utilisateur
    if (validated.appointmentId) {
      const { data: appointment } = await supabase
        .from('appointments')
        .select('id')
        .eq('id', validated.appointmentId)
        .eq('user_id', user.id)
        .single()

      if (!appointment) {
        return { success: false, error: 'Rendez-vous non trouvé' }
      }
    }

    // Préparer les données pour l'insertion
    const insertData = {
      user_id: user.id,
      contact_id: validated.contactId,
      appointment_id: validated.appointmentId,
      amount: validated.amount,
      deposit_amount: validated.depositAmount ?? 0,
      payment_method: validated.paymentMethod,
      payment_status: validated.paymentStatus,
      paid_at: validated.paidAt,
      notes: validated.notes,
    }

    const { data: paymentData, error: insertError } = await supabase
      .from('payments')
      .insert(insertData as never)
      .select('id')
      .single()

    if (insertError) {
      console.error('Error creating payment:', insertError)
      return { success: false, error: 'Erreur lors de la création du paiement' }
    }

    revalidatePath('/payments')
    revalidatePath(`/contacts/${validated.contactId}`)
    if (validated.appointmentId) {
      revalidatePath(`/appointments`)
    }

    return {
      success: true,
      data: { id: (paymentData as { id: string }).id },
    }
  } catch (error) {
    console.error('Error in createPayment:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

export async function updatePayment(
  paymentId: string,
  input: UpdatePaymentInput
): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Non authentifié' }
    }

    // Valider les données
    const validated = updatePaymentSchema.parse(input)

    // Vérifier que le paiement appartient à l'utilisateur
    const { data: payment } = await supabase
      .from('payments')
      .select('id, contact_id')
      .eq('id', paymentId)
      .eq('user_id', user.id)
      .single()

    if (!payment) {
      return { success: false, error: 'Paiement non trouvé' }
    }

    // Préparer les données pour la mise à jour
    const updateData: Record<string, unknown> = {}

    if (validated.appointmentId !== undefined) updateData.appointment_id = validated.appointmentId
    if (validated.amount !== undefined) updateData.amount = validated.amount
    if (validated.depositAmount !== undefined) updateData.deposit_amount = validated.depositAmount
    if (validated.paymentMethod !== undefined) updateData.payment_method = validated.paymentMethod
    if (validated.paymentStatus !== undefined) updateData.payment_status = validated.paymentStatus
    if (validated.paidAt !== undefined) updateData.paid_at = validated.paidAt
    if (validated.notes !== undefined) updateData.notes = validated.notes

    const { error: updateError } = await supabase
      .from('payments')
      .update(updateData as never)
      .eq('id', paymentId)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error updating payment:', updateError)
      return { success: false, error: 'Erreur lors de la mise à jour du paiement' }
    }

    revalidatePath('/payments')
    revalidatePath(`/contacts/${(payment as { contact_id: string }).contact_id}`)

    return { success: true }
  } catch (error) {
    console.error('Error in updatePayment:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

export async function deletePayment(paymentId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Non authentifié' }
    }

    // Vérifier que le paiement appartient à l'utilisateur
    const { data: payment } = await supabase
      .from('payments')
      .select('contact_id')
      .eq('id', paymentId)
      .eq('user_id', user.id)
      .single()

    if (!payment) {
      return { success: false, error: 'Paiement non trouvé' }
    }

    const { error: deleteError } = await supabase
      .from('payments')
      .delete()
      .eq('id', paymentId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting payment:', deleteError)
      return { success: false, error: 'Erreur lors de la suppression du paiement' }
    }

    revalidatePath('/payments')
    revalidatePath(`/contacts/${(payment as { contact_id: string }).contact_id}`)

    return { success: true }
  } catch (error) {
    console.error('Error in deletePayment:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}
