'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type ActionResult<T = void> = {
  success: boolean
  error?: string
  data?: T
}

export async function createSource(data: {
  name: string
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

    const { data: sourceData, error: insertError } = await supabase
      .from('contact_sources')
      .insert({
        user_id: user.id,
        name: data.name,
      } as never)
      .select('id')
      .single()

    if (insertError || !sourceData) {
      return { success: false, error: 'Impossible de créer la source' }
    }

    revalidatePath('/settings/sources')
    revalidatePath('/contacts')

    return { success: true, data: { id: (sourceData as { id: string }).id } }
  } catch (error) {
    console.error('Create source error:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

export async function updateSource(
  sourceId: string,
  data: { name: string }
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

    const { error: updateError } = await supabase
      .from('contact_sources')
      .update({ name: data.name } as never)
      .eq('id', sourceId)
      .eq('user_id', user.id)

    if (updateError) {
      return { success: false, error: 'Impossible de mettre à jour la source' }
    }

    revalidatePath('/settings/sources')
    revalidatePath('/contacts')

    return { success: true }
  } catch (error) {
    console.error('Update source error:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

export async function deleteSource(sourceId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Non authentifié' }
    }

    // Vérifier si la source est utilisée
    const { count } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('source_id', sourceId)

    if (count && count > 0) {
      return {
        success: false,
        error: `Cette source est utilisée par ${count} contact${count > 1 ? 's' : ''}`,
      }
    }

    const { error: deleteError } = await supabase
      .from('contact_sources')
      .delete()
      .eq('id', sourceId)
      .eq('user_id', user.id)

    if (deleteError) {
      return { success: false, error: 'Impossible de supprimer la source' }
    }

    revalidatePath('/settings/sources')
    revalidatePath('/contacts')

    return { success: true }
  } catch (error) {
    console.error('Delete source error:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}
