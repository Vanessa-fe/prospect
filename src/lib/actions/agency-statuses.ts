'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type ActionResult<T = void> = {
  success: boolean
  error?: string
  data?: T
}

export async function createAgencyStatus(data: {
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
        .from('agency_statuses')
        .update({ is_default: false } as never)
        .eq('user_id', user.id)
    }

    const { data: statusData, error: insertError } = await supabase
      .from('agency_statuses')
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

    revalidatePath('/settings/agency-statuses')
    revalidatePath('/agencies')

    return { success: true, data: { id: (statusData as { id: string }).id } }
  } catch (error) {
    console.error('Create agency status error:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

export async function updateAgencyStatusSetting(
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
        .from('agency_statuses')
        .update({ is_default: false } as never)
        .eq('user_id', user.id)
    }

    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.color !== undefined) updateData.color = data.color
    if (data.isDefault !== undefined) updateData.is_default = data.isDefault

    const { error: updateError } = await supabase
      .from('agency_statuses')
      .update(updateData as never)
      .eq('id', statusId)
      .eq('user_id', user.id)

    if (updateError) {
      return { success: false, error: 'Impossible de mettre à jour le statut' }
    }

    revalidatePath('/settings/agency-statuses')
    revalidatePath('/agencies')

    return { success: true }
  } catch (error) {
    console.error('Update agency status error:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

export async function deleteAgencyStatus(statusId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Non authentifié' }
    }

    // Vérifier si le statut est utilisé par des agences
    const { count } = await supabase
      .from('agencies')
      .select('*', { count: 'exact', head: true })
      .eq('status_id', statusId)

    if (count && count > 0) {
      return {
        success: false,
        error: `Ce statut est utilisé par ${count} agence${count > 1 ? 's' : ''}`,
      }
    }

    const { error: deleteError } = await supabase
      .from('agency_statuses')
      .delete()
      .eq('id', statusId)
      .eq('user_id', user.id)

    if (deleteError) {
      return { success: false, error: 'Impossible de supprimer le statut' }
    }

    revalidatePath('/settings/agency-statuses')
    revalidatePath('/agencies')

    return { success: true }
  } catch (error) {
    console.error('Delete agency status error:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}
