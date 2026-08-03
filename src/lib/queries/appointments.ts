import { createClient } from '@/lib/supabase/server'
import type { Appointment, Contact } from '@/types'
import type { AppointmentFilterInput } from '@/lib/validations/appointment'

// Type pour les rendez-vous avec le contact associé
export type AppointmentWithContact = Appointment & {
  contact: Contact
}

/**
 * Récupérer tous les rendez-vous de l'utilisateur avec filtres optionnels
 */
export async function getAppointments(
  filters?: Partial<AppointmentFilterInput>
): Promise<AppointmentWithContact[]> {
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
    .from('appointments')
    .select(
      `
      *,
      contact:contacts(*)
    `
    )
    .eq('user_id', user.id)

  // Appliquer les filtres
  if (filters?.contactId) {
    query = query.eq('contact_id', filters.contactId)
  }

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.startDate) {
    query = query.gte('start_at', filters.startDate.toISOString())
  }

  if (filters?.endDate) {
    query = query.lte('start_at', filters.endDate.toISOString())
  }

  // Tri
  const sortBy = filters?.sortBy || 'startAt'
  const sortOrder = filters?.sortOrder || 'asc'
  const sortColumn = sortBy === 'startAt' ? 'start_at' : 'created_at'

  query = query.order(sortColumn, { ascending: sortOrder === 'asc' })

  // Pagination
  const limit = filters?.limit || 50
  const offset = filters?.offset || 0
  query = query.range(offset, offset + limit - 1)

  const { data, error } = await query

  if (error || !data) {
    return []
  }

  return data as AppointmentWithContact[]
}

/**
 * Récupérer les rendez-vous d'un contact spécifique
 */
export async function getContactAppointments(
  contactId: string,
  limit: number = 50
): Promise<Appointment[]> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return []
  }

  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', user.id)
    .eq('contact_id', contactId)
    .order('start_at', { ascending: true })
    .limit(limit)

  if (error || !data) {
    return []
  }

  return data as Appointment[]
}

/**
 * Récupérer un rendez-vous par son ID
 */
export async function getAppointmentById(appointmentId: string): Promise<AppointmentWithContact | null> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return null
  }

  const { data, error } = await supabase
    .from('appointments')
    .select(
      `
      *,
      contact:contacts(*)
    `
    )
    .eq('id', appointmentId)
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    return null
  }

  return data as AppointmentWithContact
}

/**
 * Récupérer les rendez-vous à venir
 */
export async function getUpcomingAppointments(limit: number = 10): Promise<AppointmentWithContact[]> {
  return getAppointments({
    startDate: new Date(),
    sortBy: 'startAt',
    sortOrder: 'asc',
    limit,
  })
}

/**
 * Récupérer les rendez-vous du jour
 */
export async function getTodayAppointments(): Promise<AppointmentWithContact[]> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return getAppointments({
    startDate: today,
    endDate: tomorrow,
    sortBy: 'startAt',
    sortOrder: 'asc',
  })
}

/**
 * Récupérer les rendez-vous de la semaine
 */
export async function getThisWeekAppointments(): Promise<AppointmentWithContact[]> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)

  return getAppointments({
    startDate: today,
    endDate: nextWeek,
    sortBy: 'startAt',
    sortOrder: 'asc',
  })
}

/**
 * Récupérer les rendez-vous passés
 */
export async function getPastAppointments(limit: number = 20): Promise<AppointmentWithContact[]> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return []
  }

  const { data, error } = await supabase
    .from('appointments')
    .select(
      `
      *,
      contact:contacts(*)
    `
    )
    .eq('user_id', user.id)
    .lt('start_at', new Date().toISOString())
    .order('start_at', { ascending: false })
    .limit(limit)

  if (error || !data) {
    return []
  }

  return data as AppointmentWithContact[]
}

/**
 * Compter le nombre total de rendez-vous
 */
export async function getAppointmentsCount(filters?: Partial<AppointmentFilterInput>): Promise<number> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return 0
  }

  let query = supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Appliquer les mêmes filtres que getAppointments
  if (filters?.contactId) {
    query = query.eq('contact_id', filters.contactId)
  }

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.startDate) {
    query = query.gte('start_at', filters.startDate.toISOString())
  }

  if (filters?.endDate) {
    query = query.lte('start_at', filters.endDate.toISOString())
  }

  const { count, error } = await query

  if (error) {
    return 0
  }

  return count || 0
}

/**
 * Récupérer les statistiques de rendez-vous
 */
export async function getAppointmentsStats(): Promise<{
  total: number
  today: number
  thisWeek: number
  upcoming: number
  byStatus: Record<string, number>
}> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      total: 0,
      today: 0,
      thisWeek: 0,
      upcoming: 0,
      byStatus: {},
    }
  }

  // Récupérer tous les rendez-vous à venir
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('status, start_at')
    .eq('user_id', user.id)
    .gte('start_at', new Date().toISOString())
    .order('start_at', { ascending: true })

  if (error || !appointments) {
    return {
      total: 0,
      today: 0,
      thisWeek: 0,
      upcoming: 0,
      byStatus: {},
    }
  }

  // Calculer les statistiques
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)

  let todayCount = 0
  let thisWeekCount = 0
  const byStatus: Record<string, number> = {}

  appointments.forEach((apt) => {
    const startAt = new Date((apt as { start_at: string }).start_at)
    const status = (apt as { status: string }).status

    // Compter par statut
    byStatus[status] = (byStatus[status] || 0) + 1

    // Compter aujourd'hui
    if (startAt >= today && startAt < tomorrow) {
      todayCount++
    }

    // Compter cette semaine
    if (startAt >= today && startAt < nextWeek) {
      thisWeekCount++
    }
  })

  return {
    total: appointments.length,
    today: todayCount,
    thisWeek: thisWeekCount,
    upcoming: appointments.length,
    byStatus,
  }
}
