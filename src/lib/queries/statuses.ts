import { createClient } from '@/lib/supabase/server'
import type { ContactStatus } from '@/types'

export async function getAllStatuses(): Promise<ContactStatus[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data } = await supabase
    .from('contact_statuses')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('name')

  return (data as ContactStatus[]) || []
}

export async function getStatusById(statusId: string): Promise<ContactStatus | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data } = await supabase
    .from('contact_statuses')
    .select('*')
    .eq('id', statusId)
    .eq('user_id', user.id)
    .single()

  return data as ContactStatus | null
}
