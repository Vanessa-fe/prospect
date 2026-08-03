'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type ActionResult<T = void> = {
  success: boolean
  error?: string
  data?: T
}

export async function createStatus(data: {
  name: string
  color: string
  isDefault?: boolean
}): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Non authentifié' }
    }

    // Si isDefault est true, retirer le défaut des autres statuts
    if (data.isDefault) {
      await supabase
        .from('contact_statuses')
        .update({ is_default: false } as never)
        .eq('user_id', user.id)
    }

    const { data: statusData, error: insertError } = await supabase
      .from('contact_statuses')
      .insert({
        user_id: user.id,
        name: data.name,
        color: data.color,
        is_default: data.isDefault || false,
      } as never)
      .select('id')
      .single()

    if (insertError || !statusData) {
      return { success: false, error: 'Impossible de créer le statut' }
    }

    revalidatePath('/settings/statuses')
    revalidatePath('/contacts')

    return { success: true, data: { id: (statusData as { id: string }).id } }
  } catch (error) {
    console.error('Create status error:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

export async function updateStatus(
  statusId: string,
  data: {
    name?: string
    color?: string
    isDefault?: boolean
  }
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

    // Si isDefault est true, retirer le défaut des autres statuts
    if (data.isDefault) {
      await supabase
        .from('contact_statuses')
        .update({ is_default: false } as never)
        .eq('user_id', user.id)
    }

    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.color !== undefined) updateData.color = data.color
    if (data.isDefault !== undefined) updateData.is_default = data.isDefault

    const { error: updateError } = await supabase
      .from('contact_statuses')
      .update(updateData as never)
      .eq('id', statusId)
      .eq('user_id', user.id)

    if (updateError) {
      return { success: false, error: 'Impossible de mettre à jour le statut' }
    }

    revalidatePath('/settings/statuses')
    revalidatePath('/contacts')

    return { success: true }
  } catch (error) {
    console.error('Update status error:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

export async function deleteStatus(statusId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Non authentifié' }
    }

    // Vérifier si le statut est utilisé
    const { count } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('status_id', statusId)

    if (count && count > 0) {
      return {
        success: false,
        error: `Ce statut est utilisé par ${count} contact${count > 1 ? 's' : ''}`,
      }
    }

    const { error: deleteError } = await supabase
      .from('contact_statuses')
      .delete()
      .eq('id', statusId)
      .eq('user_id', user.id)

    if (deleteError) {
      return { success: false, error: 'Impossible de supprimer le statut' }
    }

    revalidatePath('/settings/statuses')
    revalidatePath('/contacts')

    return { success: true }
  } catch (error) {
    console.error('Delete status error:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}
