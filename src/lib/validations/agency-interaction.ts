import { z } from 'zod'
import {
  interactionTypes,
  interactionDirections,
  interactionChannels,
  type InteractionType,
  type InteractionDirection,
  type InteractionChannel,
} from './interaction'

/**
 * Schémas de validation pour les interactions d'agences
 * (mêmes énumérations que les interactions de contacts, réutilisées telles quelles)
 */
export {
  interactionTypes as agencyInteractionTypes,
  interactionDirections as agencyInteractionDirections,
  interactionChannels as agencyInteractionChannels,
}
export type AgencyInteractionType = InteractionType
export type AgencyInteractionDirection = InteractionDirection
export type AgencyInteractionChannel = InteractionChannel

const baseAgencyInteractionSchema = z.object({
  agencyId: z.string().uuid('L\'ID de l\'agence n\'est pas valide'),
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

export const createAgencyInteractionSchema = baseAgencyInteractionSchema
  .refine(
    (data) => {
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

export const updateAgencyInteractionSchema = baseAgencyInteractionSchema
  .partial()
  .omit({ agencyId: true })

export type CreateAgencyInteractionInput = z.infer<typeof createAgencyInteractionSchema>
export type UpdateAgencyInteractionInput = z.infer<typeof updateAgencyInteractionSchema>
