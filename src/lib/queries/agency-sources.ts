import { createClient } from '@/lib/supabase/server'
import type { AgencySource } from '@/types'

export async function getAllAgencySources(): Promise<AgencySource[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data } = await supabase
    .from('agency_sources')
    .select('*')
    .eq('user_id', user.id)
    .order('name')

  return (data as AgencySource[]) || []
}

export async function getAgencySourceById(sourceId: string): Promise<AgencySource | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data } = await supabase
    .from('agency_sources')
    .select('*')
    .eq('id', sourceId)
    .eq('user_id', user.id)
    .single()

  return data as AgencySource | null
}
