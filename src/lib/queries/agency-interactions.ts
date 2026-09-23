import { createClient } from '@/lib/supabase/server'
import type { AgencyInteraction } from '@/types'

/**
 * Récupérer les interactions d'une agence spécifique
 */
export async function getAgencyInteractions(
  agencyId: string,
  limit: number = 50
): Promise<AgencyInteraction[]> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return []
  }

  const { data, error } = await supabase
    .from('agency_interactions')
    .select('*')
    .eq('user_id', user.id)
    .eq('agency_id', agencyId)
    .order('occurred_at', { ascending: false })
    .limit(limit)

  if (error || !data) {
    return []
  }

  return data as AgencyInteraction[]
}

/**
 * Récupérer une interaction d'agence par son ID
 */
export async function getAgencyInteractionById(
  interactionId: string
): Promise<AgencyInteraction | null> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return null
  }

  const { data, error } = await supabase
    .from('agency_interactions')
    .select('*')
    .eq('id', interactionId)
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    return null
  }

  return data as AgencyInteraction
}
