import { createClient } from '@/lib/supabase/server'
import type { AgencyWithRelations, AgencyStatus, AgencySource } from '@/types'
import type { AgencyFilterInput } from '@/lib/validations/agency'

/**
 * Récupérer toutes les agences de l'utilisateur avec filtres optionnels
 */
export async function getAgencies(
  filters?: Partial<AgencyFilterInput>
): Promise<AgencyWithRelations[]> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return []
  }

  let query = supabase
    .from('agencies')
    .select(
      `
      *,
      status:agency_statuses(id, name, color, order),
      source:agency_sources(id, name, icon)
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

  // Recherche textuelle
  if (filters?.search) {
    const searchTerm = `%${filters.search}%`
    query = query.or(
      `name.ilike.${searchTerm},website.ilike.${searchTerm},city.ilike.${searchTerm},contact_name.ilike.${searchTerm}`
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
        : 'name'

  query = query.order(sortColumn, { ascending: sortOrder === 'asc' })

  // Pagination
  const limit = filters?.limit || 50
  const offset = filters?.offset || 0
  query = query.range(offset, offset + limit - 1)

  const { data, error } = await query

  if (error || !data) {
    return []
  }

  return data as AgencyWithRelations[]
}

/**
 * Récupérer une agence par son ID avec toutes ses relations
 */
export async function getAgencyById(agencyId: string): Promise<AgencyWithRelations | null> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return null
  }

  const { data, error } = await supabase
    .from('agencies')
    .select(
      `
      *,
      status:agency_statuses(id, name, color, order),
      source:agency_sources(id, name, icon)
    `
    )
    .eq('id', agencyId)
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    return null
  }

  return data as AgencyWithRelations
}

/**
 * Récupérer les agences "à contacter" : celles encore au statut par défaut
 * et jamais contactées (last_interaction_at IS NULL). Utilisé par la section
 * "Aujourd'hui" de la page /agencies.
 */
export async function getAgenciesToContact(): Promise<AgencyWithRelations[]> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return []
  }

  const { data: defaultStatus } = await supabase
    .from('agency_statuses')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_default', true)
    .single()

  if (!defaultStatus) {
    return []
  }

  const { data, error } = await supabase
    .from('agencies')
    .select(
      `
      *,
      status:agency_statuses(id, name, color, order),
      source:agency_sources(id, name, icon)
    `
    )
    .eq('user_id', user.id)
    .eq('status_id', (defaultStatus as { id: string }).id)
    .is('last_interaction_at', null)
    .order('created_at', { ascending: false })

  if (error || !data) {
    return []
  }

  return data as AgencyWithRelations[]
}

/**
 * Compter le nombre total d'agences de l'utilisateur
 */
export async function getAgenciesCount(filters?: Partial<AgencyFilterInput>): Promise<number> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return 0
  }

  let query = supabase
    .from('agencies')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if (filters?.statusId) {
    query = query.eq('status_id', filters.statusId)
  }

  if (filters?.sourceId) {
    query = query.eq('source_id', filters.sourceId)
  }

  if (filters?.search) {
    const searchTerm = `%${filters.search}%`
    query = query.or(
      `name.ilike.${searchTerm},website.ilike.${searchTerm},city.ilike.${searchTerm},contact_name.ilike.${searchTerm}`
    )
  }

  const { count, error } = await query

  if (error) {
    return 0
  }

  return count || 0
}

/**
 * Récupérer tous les statuts d'agences de l'utilisateur (triés par ordre d'affichage)
 */
export async function getAgencyStatuses(): Promise<AgencyStatus[]> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return []
  }

  const { data, error } = await supabase
    .from('agency_statuses')
    .select('*')
    .eq('user_id', user.id)
    .order('order', { ascending: true })

  if (error || !data) {
    return []
  }

  return data
}

/**
 * Récupérer toutes les sources d'agences de l'utilisateur (triées par ordre d'affichage)
 */
export async function getAgencySources(): Promise<AgencySource[]> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return []
  }

  const { data, error } = await supabase
    .from('agency_sources')
    .select('*')
    .eq('user_id', user.id)
    .order('order', { ascending: true })

  if (error || !data) {
    return []
  }

  return data
}

/**
 * Récupérer le statut par défaut de l'utilisateur pour les agences
 */
export async function getDefaultAgencyStatus(): Promise<AgencyStatus | null> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return null
  }

  const { data, error } = await supabase
    .from('agency_statuses')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_default', true)
    .single()

  if (error || !data) {
    return null
  }

  return data
}
