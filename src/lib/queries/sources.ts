import { createClient } from '@/lib/supabase/server'
import type { ContactSource } from '@/types'

export async function getAllSources(): Promise<ContactSource[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data } = await supabase
    .from('contact_sources')
    .select('*')
    .eq('user_id', user.id)
    .order('name')

  return (data as ContactSource[]) || []
}

export async function getSourceById(sourceId: string): Promise<ContactSource | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data } = await supabase
    .from('contact_sources')
    .select('*')
    .eq('id', sourceId)
    .eq('user_id', user.id)
    .single()

  return data as ContactSource | null
}
