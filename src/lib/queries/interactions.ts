import { createClient } from '@/lib/supabase/server'
import type { Interaction, Contact } from '@/types'
import type { InteractionFilterInput } from '@/lib/validations/interaction'

// Type pour les interactions avec le contact associé
export type InteractionWithContact = Interaction & {
  contact: Contact
}

/**
 * Récupérer toutes les interactions de l'utilisateur avec filtres optionnels
 */
export async function getInteractions(
  filters?: Partial<InteractionFilterInput>
): Promise<Interaction[]> {
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
    .from('interactions')
    .select('*')
    .eq('user_id', user.id)

  // Appliquer les filtres
  if (filters?.contactId) {
    query = query.eq('contact_id', filters.contactId)
  }

  if (filters?.type) {
    query = query.eq('type', filters.type)
  }

  if (filters?.channel) {
    query = query.eq('channel', filters.channel)
  }

  if (filters?.direction) {
    query = query.eq('direction', filters.direction)
  }

  if (filters?.startDate) {
    query = query.gte('occurred_at', filters.startDate.toISOString())
  }

  if (filters?.endDate) {
    query = query.lte('occurred_at', filters.endDate.toISOString())
  }

  // Tri par date décroissante (plus récent en premier)
  query = query.order('occurred_at', { ascending: false })

  // Pagination
  const limit = filters?.limit || 50
  const offset = filters?.offset || 0
  query = query.range(offset, offset + limit - 1)

  const { data, error } = await query

  if (error || !data) {
    return []
  }

  return data as Interaction[]
}

/**
 * Récupérer les interactions d'un contact spécifique
 */
export async function getContactInteractions(
  contactId: string,
  limit: number = 50
): Promise<Interaction[]> {
  return getInteractions({ contactId, limit })
}

/**
 * Récupérer une interaction par son ID
 */
export async function getInteractionById(interactionId: string): Promise<Interaction | null> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return null
  }

  const { data, error } = await supabase
    .from('interactions')
    .select('*')
    .eq('id', interactionId)
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    return null
  }

  return data as Interaction
}

/**
 * Récupérer les interactions récentes de l'utilisateur (tous contacts confondus)
 */
export async function getRecentInteractions(limit: number = 10): Promise<InteractionWithContact[]> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return []
  }

  const { data, error } = await supabase
    .from('interactions')
    .select(
      `
      *,
      contact:contacts(*)
    `
    )
    .eq('user_id', user.id)
    .order('occurred_at', { ascending: false })
    .limit(limit)

  if (error || !data) {
    return []
  }

  return data as InteractionWithContact[]
}

/**
 * Compter le nombre total d'interactions pour un contact
 */
export async function getContactInteractionsCount(contactId: string): Promise<number> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return 0
  }

  const { count, error } = await supabase
    .from('interactions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('contact_id', contactId)

  if (error) {
    return 0
  }

  return count || 0
}

/**
 * Récupérer les statistiques d'interactions pour un contact
 */
export async function getContactInteractionStats(contactId: string): Promise<{
  totalInteractions: number
  lastInteractionDate: string | null
  interactionsByType: Record<string, number>
}> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      totalInteractions: 0,
      lastInteractionDate: null,
      interactionsByType: {},
    }
  }

  // Récupérer toutes les interactions du contact
  const { data: interactions, error } = await supabase
    .from('interactions')
    .select('type, occurred_at')
    .eq('user_id', user.id)
    .eq('contact_id', contactId)
    .order('occurred_at', { ascending: false })

  if (error || !interactions) {
    return {
      totalInteractions: 0,
      lastInteractionDate: null,
      interactionsByType: {},
    }
  }

  // Calculer les statistiques
  const interactionsByType: Record<string, number> = {}
  interactions.forEach((interaction) => {
    const type = (interaction as { type: string }).type
    interactionsByType[type] = (interactionsByType[type] || 0) + 1
  })

  return {
    totalInteractions: interactions.length,
    lastInteractionDate:
      interactions.length > 0 && interactions[0]
        ? (interactions[0] as { occurred_at: string }).occurred_at
        : null,
    interactionsByType,
  }
}
