import { createClient } from '@/lib/supabase/server'
import type { ContactWithRelations, ContactStatus, ContactSource } from '@/types'
import type { ContactFilterInput } from '@/lib/validations/contact'

/**
 * Récupérer tous les contacts de l'utilisateur avec filtres optionnels
 */
export async function getContacts(
  filters?: Partial<ContactFilterInput>
): Promise<ContactWithRelations[]> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return []
  }

  // Construire la requête de base
  let query = supabase
    .from('contacts')
    .select(
      `
      *,
      status:contact_statuses(id, name, color, order),
      source:contact_sources(id, name, icon),
      channels:contact_channels(id, channel_type, username, external_identifier)
    `
    )
    .eq('user_id', user.id)

  // Appliquer les filtres
  if (filters?.statusId) {
    query = query.eq('status_id', filters.statusId)
  }

  if (filters?.sourceId) {
    query = query.eq('source_id', filters.sourceId)
  }

  if (filters?.riskLevel) {
    query = query.eq('risk_level', filters.riskLevel)
  }

  if (filters?.favorite !== undefined) {
    query = query.eq('favorite', filters.favorite)
  }

  // Recherche textuelle
  if (filters?.search) {
    const searchTerm = `%${filters.search}%`
    query = query.or(
      `first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},nickname.ilike.${searchTerm},phone.ilike.${searchTerm},email.ilike.${searchTerm}`
    )
  }

  // Tri
  const sortBy = filters?.sortBy || 'createdAt'
  const sortOrder = filters?.sortOrder || 'desc'
  const sortColumn =
    sortBy === 'createdAt'
      ? 'created_at'
      : sortBy === 'lastInteractionAt'
        ? 'last_interaction_at'
        : sortBy === 'firstName'
          ? 'first_name'
          : 'last_name'

  query = query.order(sortColumn, { ascending: sortOrder === 'asc' })

  // Pagination
  const limit = filters?.limit || 50
  const offset = filters?.offset || 0
  query = query.range(offset, offset + limit - 1)

  const { data, error } = await query

  if (error || !data) {
    return []
  }

  return data as ContactWithRelations[]
}

/**
 * Récupérer un contact par son ID avec toutes ses relations
 */
export async function getContactById(contactId: string): Promise<ContactWithRelations | null> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return null
  }

  const { data, error } = await supabase
    .from('contacts')
    .select(
      `
      *,
      status:contact_statuses(id, name, color, order),
      source:contact_sources(id, name, icon),
      channels:contact_channels(id, channel_type, username, external_identifier)
    `
    )
    .eq('id', contactId)
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    return null
  }

  return data as ContactWithRelations
}

/**
 * Récupérer les contacts favoris de l'utilisateur
 */
export async function getFavoriteContacts(): Promise<ContactWithRelations[]> {
  return getContacts({ favorite: true, limit: 20 })
}

/**
 * Récupérer les contacts récemment ajoutés
 */
export async function getRecentContacts(limit: number = 10): Promise<ContactWithRelations[]> {
  return getContacts({ sortBy: 'createdAt', sortOrder: 'desc', limit })
}

/**
 * Récupérer les contacts avec lesquels on a récemment interagi
 */
export async function getRecentlyContactedContacts(
  limit: number = 10
): Promise<ContactWithRelations[]> {
  return getContacts({ sortBy: 'lastInteractionAt', sortOrder: 'desc', limit })
}

/**
 * Récupérer les contacts à surveiller (risk_level = 'monitor', 'insistent', 'blocked')
 */
export async function getContactsToMonitor(): Promise<ContactWithRelations[]> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return []
  }

  const { data, error } = await supabase
    .from('contacts')
    .select(
      `
      *,
      status:contact_statuses(id, name, color, order),
      source:contact_sources(id, name, icon),
      channels:contact_channels(id, channel_type, username, external_identifier)
    `
    )
    .eq('user_id', user.id)
    .in('risk_level', ['monitor', 'insistent', 'blocked'])
    .order('risk_level', { ascending: false })
    .order('created_at', { ascending: false })

  if (error || !data) {
    return []
  }

  return data as ContactWithRelations[]
}

/**
 * Compter le nombre total de contacts de l'utilisateur
 */
export async function getContactsCount(filters?: Partial<ContactFilterInput>): Promise<number> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return 0
  }

  let query = supabase
    .from('contacts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Appliquer les mêmes filtres que getContacts
  if (filters?.statusId) {
    query = query.eq('status_id', filters.statusId)
  }

  if (filters?.sourceId) {
    query = query.eq('source_id', filters.sourceId)
  }

  if (filters?.riskLevel) {
    query = query.eq('risk_level', filters.riskLevel)
  }

  if (filters?.favorite !== undefined) {
    query = query.eq('favorite', filters.favorite)
  }

  if (filters?.search) {
    const searchTerm = `%${filters.search}%`
    query = query.or(
      `first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},nickname.ilike.${searchTerm},phone.ilike.${searchTerm},email.ilike.${searchTerm}`
    )
  }

  const { count, error } = await query

  if (error) {
    return 0
  }

  return count || 0
}

/**
 * Récupérer tous les statuts de l'utilisateur
 */
export async function getContactStatuses(): Promise<ContactStatus[]> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return []
  }

  const { data, error } = await supabase
    .from('contact_statuses')
    .select('*')
    .eq('user_id', user.id)
    .order('order', { ascending: true })

  if (error || !data) {
    return []
  }

  return data
}

/**
 * Récupérer toutes les sources de l'utilisateur
 */
export async function getContactSources(): Promise<ContactSource[]> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return []
  }

  const { data, error } = await supabase
    .from('contact_sources')
    .select('*')
    .eq('user_id', user.id)
    .order('order', { ascending: true })

  if (error || !data) {
    return []
  }

  return data
}

/**
 * Récupérer le statut par défaut de l'utilisateur
 */
export async function getDefaultContactStatus(): Promise<ContactStatus | null> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return null
  }

  const { data, error } = await supabase
    .from('contact_statuses')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_default', true)
    .single()

  if (error || !data) {
    return null
  }

  return data
}
