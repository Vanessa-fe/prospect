import { z } from 'zod'

/**
 * Schémas de validation pour les rendez-vous
 */

// Énumération des statuts de rendez-vous
export const appointmentStatuses = [
  'scheduled',
  'confirmed',
  'completed',
  'cancelled',
  'no_show',
] as const
export type AppointmentStatus = (typeof appointmentStatuses)[number]

/**
 * Schéma de création d'un rendez-vous
 */
export const createAppointmentSchema = z
  .object({
    contactId: z.string().uuid('L\'ID du contact n\'est pas valide'),
    title: z
      .string()
      .min(1, 'Le titre est requis')
      .max(200, 'Le titre est trop long')
      .trim(),
    startAt: z.coerce.date({
      errorMap: () => ({ message: 'La date de début n\'est pas valide' }),
    }),
    endAt: z.coerce
      .date({
        errorMap: () => ({ message: 'La date de fin n\'est pas valide' }),
      })
      .optional()
      .nullable(),
    location: z
      .string()
      .max(500, 'L\'adresse est trop longue')
      .trim()
      .optional()
      .nullable(),
    status: z
      .enum(appointmentStatuses, {
        errorMap: () => ({ message: 'Le statut n\'est pas valide' }),
      })
      .default('scheduled'),
    notes: z
      .string()
      .max(5000, 'Les notes sont trop longues')
      .trim()
      .optional()
      .nullable(),
    reminderAt: z.coerce
      .date({
        errorMap: () => ({ message: 'La date du rappel n\'est pas valide' }),
      })
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      // Si endAt est défini, il doit être après startAt
      if (data.endAt) {
        return data.endAt > data.startAt
      }
      return true
    },
    {
      message: 'La date de fin doit être après la date de début',
      path: ['endAt'],
    }
  )
  .refine(
    (data) => {
      // Si reminderAt est défini, il doit être avant startAt
      if (data.reminderAt) {
        return data.reminderAt < data.startAt
      }
      return true
    },
    {
      message: 'Le rappel doit être programmé avant le rendez-vous',
      path: ['reminderAt'],
    }
  )

/**
 * Schéma de base pour les rendez-vous (sans refinements)
 */
const baseAppointmentSchema = z.object({
  contactId: z.string().uuid('L\'ID du contact n\'est pas valide'),
  title: z
    .string()
    .min(1, 'Le titre est requis')
    .max(200, 'Le titre est trop long')
    .trim(),
  startAt: z.coerce.date({
    errorMap: () => ({ message: 'La date de début n\'est pas valide' }),
  }),
  endAt: z.coerce
    .date({
      errorMap: () => ({ message: 'La date de fin n\'est pas valide' }),
    })
    .optional()
    .nullable(),
  location: z
    .string()
    .max(500, 'L\'adresse est trop longue')
    .trim()
    .optional()
    .nullable(),
  status: z
    .enum(appointmentStatuses, {
      errorMap: () => ({ message: 'Le statut n\'est pas valide' }),
    })
    .default('scheduled'),
  notes: z
    .string()
    .max(5000, 'Les notes sont trop longues')
    .trim()
    .optional()
    .nullable(),
  reminderAt: z.coerce
    .date({
      errorMap: () => ({ message: 'La date du rappel n\'est pas valide' }),
    })
    .optional()
    .nullable(),
})

/**
 * Schéma de mise à jour d'un rendez-vous
 */
export const updateAppointmentSchema = baseAppointmentSchema.partial().omit({ contactId: true })

/**
 * Schéma pour les filtres de recherche de rendez-vous
 */
export const appointmentFilterSchema = z.object({
  contactId: z.string().uuid().optional(),
  status: z.enum(appointmentStatuses).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  sortBy: z.enum(['startAt', 'createdAt']).default('startAt'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
})

// Types inférés
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>
export type AppointmentFilterInput = z.infer<typeof appointmentFilterSchema>

/**
 * Labels pour les statuts de rendez-vous
 */
export const appointmentStatusLabels: Record<AppointmentStatus, string> = {
  scheduled: 'Prévu',
  confirmed: 'Confirmé',
  completed: 'Terminé',
  cancelled: 'Annulé',
  no_show: 'Absent',
}

/**
 * Couleurs pour les statuts de rendez-vous
 */
export const appointmentStatusColors: Record<AppointmentStatus, string> = {
  scheduled: 'text-blue-600 bg-blue-50 dark:bg-blue-950',
  confirmed: 'text-green-600 bg-green-50 dark:bg-green-950',
  completed: 'text-gray-600 bg-gray-50 dark:bg-gray-950',
  cancelled: 'text-red-600 bg-red-50 dark:bg-red-950',
  no_show: 'text-orange-600 bg-orange-50 dark:bg-orange-950',
}

/**
 * Fonction utilitaire pour calculer la durée d'un rendez-vous
 */
export function getAppointmentDuration(startAt: Date, endAt: Date | null): string | null {
  if (!endAt) return null

  const durationMs = endAt.getTime() - startAt.getTime()
  const durationMinutes = Math.floor(durationMs / (1000 * 60))

  if (durationMinutes < 60) {
    return `${durationMinutes} min`
  }

  const hours = Math.floor(durationMinutes / 60)
  const minutes = durationMinutes % 60

  return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`
}

/**
 * Fonction utilitaire pour vérifier si un rendez-vous est passé
 */
export function isAppointmentPast(startAt: Date): boolean {
  return startAt < new Date()
}

/**
 * Fonction utilitaire pour vérifier si un rendez-vous est aujourd'hui
 */
export function isAppointmentToday(startAt: Date): boolean {
  const today = new Date()
  return (
    startAt.getDate() === today.getDate() &&
    startAt.getMonth() === today.getMonth() &&
    startAt.getFullYear() === today.getFullYear()
  )
}

/**
 * Fonction utilitaire pour vérifier si un rendez-vous est cette semaine
 */
export function isAppointmentThisWeek(startAt: Date): boolean {
  const today = new Date()
  const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
  return startAt >= today && startAt <= weekFromNow
}
