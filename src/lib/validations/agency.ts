import { z } from 'zod'
import { normalizePhoneNumber } from './contact'

/**
 * Schémas de validation pour les agences
 */

// Énumération des fourchettes de taille
export const sizeRanges = ['1-5', '6-15', '16-50', '50+'] as const
export type SizeRangeInput = (typeof sizeRanges)[number]

// Énumération des types de signal
export const signalTypes = ['job_posting_dev', 'nextjs_portfolio', 'ai_offer', 'other'] as const
export type SignalTypeInput = (typeof signalTypes)[number]

// Énumération des canaux préférés
export const preferredChannels = ['email', 'linkedin', 'phone', 'other'] as const
export type PreferredChannelInput = (typeof preferredChannels)[number]

/**
 * Validation du numéro de téléphone de contact (réutilise la logique de contact.ts,
 * pas de raison de dupliquer cette validation/normalisation)
 */
const contactPhoneSchema = z
  .string()
  .optional()
  .nullable()
  .transform((value) => {
    if (!value || value.trim() === '') return null
    return normalizePhoneNumber(value) ?? value
  })

/**
 * Schéma de création d'une agence
 */
export const createAgencySchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(200, 'Le nom est trop long').trim(),
  website: z
    .string()
    .max(500, 'L\'URL est trop longue')
    .trim()
    .optional()
    .nullable()
    .or(z.literal('')),
  city: z
    .string()
    .max(100, 'La ville est trop longue')
    .trim()
    .optional()
    .nullable(),
  sizeRange: z
    .enum(sizeRanges, {
      errorMap: () => ({ message: 'La fourchette de taille n\'est pas valide' }),
    })
    .optional()
    .nullable(),
  signalType: z
    .enum(signalTypes, {
      errorMap: () => ({ message: 'Le type de signal n\'est pas valide' }),
    })
    .optional()
    .nullable(),
  signalUrl: z
    .string()
    .max(500, 'L\'URL du signal est trop longue')
    .trim()
    .optional()
    .nullable()
    .or(z.literal('')),
  contactName: z
    .string()
    .max(200, 'Le nom du contact est trop long')
    .trim()
    .optional()
    .nullable(),
  contactRole: z
    .string()
    .max(200, 'Le rôle du contact est trop long')
    .trim()
    .optional()
    .nullable(),
  contactEmail: z
    .string()
    .email('L\'email n\'est pas valide')
    .max(255, 'L\'email est trop long')
    .trim()
    .optional()
    .nullable()
    .or(z.literal('')),
  contactPhone: contactPhoneSchema,
  preferredChannel: z
    .enum(preferredChannels, {
      errorMap: () => ({ message: 'Le canal préféré n\'est pas valide' }),
    })
    .optional()
    .nullable(),
  statusId: z
    .string()
    .uuid('L\'ID du statut n\'est pas valide')
    .optional()
    .nullable(),
  sourceId: z
    .string()
    .uuid('L\'ID de la source n\'est pas valide')
    .optional()
    .nullable(),
  notes: z
    .string()
    .max(5000, 'Les notes sont trop longues')
    .trim()
    .optional()
    .nullable(),
  detectedStack: z.array(z.string()).optional(),
})

/**
 * Schéma de mise à jour d'une agence
 * Tous les champs sont optionnels
 */
export const updateAgencySchema = createAgencySchema.partial()

// Types inférés
export type CreateAgencyInput = z.infer<typeof createAgencySchema>
export type UpdateAgencyInput = z.infer<typeof updateAgencySchema>

/**
 * Schéma pour les filtres de recherche d'agences
 */
export const agencyFilterSchema = z.object({
  search: z.string().trim().optional(),
  statusId: z.string().uuid().optional(),
  sourceId: z.string().uuid().optional(),
  sortBy: z.enum(['name', 'createdAt', 'lastInteractionAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
})

export type AgencyFilterInput = z.infer<typeof agencyFilterSchema>

/**
 * Normalise une URL de site web pour la comparaison (détection de doublons).
 * Retire le protocole, le préfixe www. et le slash final.
 */
export function normalizeWebsite(website: string): string | null {
  if (!website || website.trim() === '') return null

  let normalized = website.trim().toLowerCase()
  normalized = normalized.replace(/^https?:\/\//, '')
  normalized = normalized.replace(/^www\./, '')
  normalized = normalized.replace(/\/+$/, '')

  return normalized || null
}

/**
 * Fonction utilitaire pour détecter les doublons potentiels d'agences
 * (avertissement, pas un blocage strict — même esprit que isDuplicateContact)
 */
export function isDuplicateAgency(
  agency1: { website?: string | null; name?: string | null },
  agency2: { website?: string | null; name?: string | null }
): boolean {
  if (agency1.website && agency2.website) {
    const website1 = normalizeWebsite(agency1.website)
    const website2 = normalizeWebsite(agency2.website)
    if (website1 && website2 && website1 === website2) {
      return true
    }
  }

  return false
}
