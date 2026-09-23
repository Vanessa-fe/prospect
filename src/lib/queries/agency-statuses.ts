import { createClient } from '@/lib/supabase/server'
import type { AgencyStatus } from '@/types'

export async function getAllAgencyStatuses(): Promise<AgencyStatus[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data } = await supabase
    .from('agency_statuses')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('name')

  return (data as AgencyStatus[]) || []
}

export async function getAgencyStatusById(statusId: string): Promise<AgencyStatus | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data } = await supabase
    .from('agency_statuses')
    .select('*')
    .eq('id', statusId)
    .eq('user_id', user.id)
    .single()

  return data as AgencyStatus | null
}
