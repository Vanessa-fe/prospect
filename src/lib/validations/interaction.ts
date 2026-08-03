import { z } from 'zod'

/**
 * Schémas de validation pour les interactions
 */

// Énumération des types d'interactions
export const interactionTypes = [
  'message',
  'call_incoming',
  'call_outgoing',
  'call_missed',
  'note',
  'reminder',
  'system_event',
] as const
export type InteractionType = (typeof interactionTypes)[number]

// Énumération des directions
export const interactionDirections = ['incoming', 'outgoing'] as const
export type InteractionDirection = (typeof interactionDirections)[number]

// Énumération des canaux
export const interactionChannels = [
  'whatsapp',
  'sms',
  'telegram',
  'signal',
  'phone',
  'instagram',
  'email',
  'other',
] as const
export type InteractionChannel = (typeof interactionChannels)[number]

/**
 * Schéma de base pour les interactions (sans refinements pour permettre .partial())
 */
const baseInteractionSchema = z.object({
  contactId: z.string().uuid('L\'ID du contact n\'est pas valide'),
  type: z.enum(interactionTypes, {
    errorMap: () => ({ message: 'Le type d\'interaction n\'est pas valide' }),
  }),
  channel: z
    .enum(interactionChannels, {
      errorMap: () => ({ message: 'Le canal n\'est pas valide' }),
    })
    .optional()
    .nullable(),
  occurredAt: z.coerce.date({
    errorMap: () => ({ message: 'La date n\'est pas valide' }),
  }),
  content: z
    .string()
    .max(5000, 'Le contenu est trop long')
    .trim()
    .optional()
    .nullable(),
  duration: z
    .number()
    .int('La durée doit être un nombre entier')
    .min(0, 'La durée ne peut pas être négative')
    .optional()
    .nullable(),
  direction: z
    .enum(interactionDirections, {
      errorMap: () => ({ message: 'La direction n\'est pas valide' }),
    })
    .optional()
    .nullable(),
})

/**
 * Schéma de création d'une interaction
 */
export const createInteractionSchema = baseInteractionSchema
  .refine(
    (data) => {
      // Si c'est un appel, la direction est requise
      const callTypes = ['call_incoming', 'call_outgoing', 'call_missed']
      if (callTypes.includes(data.type)) {
        return data.direction !== null && data.direction !== undefined
      }
      return true
    },
    {
      message: 'La direction est requise pour les appels',
      path: ['direction'],
    }
  )
  .refine(
    (data) => {
      // Si c'est un message, le contenu est requis
      if (data.type === 'message' || data.type === 'note') {
        return data.content && data.content.trim().length > 0
      }
      return true
    },
    {
      message: 'Le contenu est requis pour les messages et notes',
      path: ['content'],
    }
  )

/**
 * Schéma de mise à jour d'une interaction
 */
export const updateInteractionSchema = baseInteractionSchema.partial().omit({ contactId: true })

/**
 * Schéma pour les filtres de recherche d'interactions
 */
export const interactionFilterSchema = z.object({
  contactId: z.string().uuid().optional(),
  type: z.enum(interactionTypes).optional(),
  channel: z.enum(interactionChannels).optional(),
  direction: z.enum(interactionDirections).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
})

// Types inférés
export type CreateInteractionInput = z.infer<typeof createInteractionSchema>
export type UpdateInteractionInput = z.infer<typeof updateInteractionSchema>
export type InteractionFilterInput = z.infer<typeof interactionFilterSchema>

/**
 * Labels pour les types d'interactions
 */
export const interactionTypeLabels: Record<InteractionType, string> = {
  message: 'Message',
  call_incoming: 'Appel entrant',
  call_outgoing: 'Appel sortant',
  call_missed: 'Appel manqué',
  note: 'Note',
  reminder: 'Rappel',
  system_event: 'Événement système',
}

/**
 * Labels pour les canaux
 */
export const interactionChannelLabels: Record<InteractionChannel, string> = {
  whatsapp: 'WhatsApp',
  sms: 'SMS',
  telegram: 'Telegram',
  signal: 'Signal',
  phone: 'Téléphone',
  instagram: 'Instagram',
  email: 'Email',
  other: 'Autre',
}

/**
 * Fonction utilitaire pour formater la durée d'un appel
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}
