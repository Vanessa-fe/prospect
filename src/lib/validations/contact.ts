import { z } from 'zod'
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js'

/**
 * Schémas de validation pour les contacts
 */

// Énumération des niveaux de risque
export const riskLevels = ['normal', 'monitor', 'insistent', 'blocked'] as const
export type RiskLevel = (typeof riskLevels)[number]

// Énumération des types de canaux
export const channelTypes = [
  'whatsapp',
  'sms',
  'telegram',
  'signal',
  'phone',
  'instagram',
  'email',
  'website',
  'other',
] as const
export type ChannelType = (typeof channelTypes)[number]

/**
 * Validation du numéro de téléphone avec normalisation
 * Accepte les formats internationaux et locaux
 */
const phoneSchema = z
  .string()
  .optional()
  .refine(
    (value) => {
      if (!value || value.trim() === '') return true
      try {
        return isValidPhoneNumber(value)
      } catch {
        return false
      }
    },
    {
      message: 'Le numéro de téléphone n\'est pas valide',
    }
  )
  .transform((value) => {
    if (!value || value.trim() === '') return undefined
    try {
      const phoneNumber = parsePhoneNumber(value)
      return phoneNumber.format('E.164') // Format international standard
    } catch {
      return value // Retourne la valeur originale si le parsing échoue
    }
  })

/**
 * Schéma de création d'un contact
 */
export const createContactSchema = z.object({
  firstName: z
    .string()
    .min(1, 'Le prénom est requis')
    .max(100, 'Le prénom est trop long')
    .trim(),
  lastName: z
    .string()
    .max(100, 'Le nom est trop long')
    .trim()
    .optional()
    .nullable(),
  nickname: z
    .string()
    .max(100, 'Le surnom est trop long')
    .trim()
    .optional()
    .nullable(),
  phone: phoneSchema,
  email: z
    .string()
    .email('L\'email n\'est pas valide')
    .max(255, 'L\'email est trop long')
    .trim()
    .optional()
    .nullable()
    .or(z.literal('')),
  age: z
    .number()
    .int('L\'âge doit être un nombre entier')
    .min(0, 'L\'âge ne peut pas être négatif')
    .max(150, 'L\'âge n\'est pas valide')
    .optional()
    .nullable(),
  city: z
    .string()
    .max(100, 'La ville est trop longue')
    .trim()
    .optional()
    .nullable(),
  sourceId: z
    .string()
    .uuid('L\'ID de la source n\'est pas valide')
    .optional()
    .nullable(),
  statusId: z
    .string()
    .uuid('L\'ID du statut n\'est pas valide')
    .optional()
    .nullable(),
  favorite: z.boolean().default(false),
  riskLevel: z
    .enum(riskLevels, {
      errorMap: () => ({ message: 'Le niveau de risque n\'est pas valide' }),
    })
    .default('normal'),
  notes: z
    .string()
    .max(5000, 'Les notes sont trop longues')
    .trim()
    .optional()
    .nullable(),
})

/**
 * Schéma de mise à jour d'un contact
 * Tous les champs sont optionnels
 */
export const updateContactSchema = createContactSchema.partial()

/**
 * Schéma pour l'ajout d'un canal de communication
 */
export const createContactChannelSchema = z.object({
  contactId: z.string().uuid('L\'ID du contact n\'est pas valide'),
  channelType: z.enum(channelTypes, {
    errorMap: () => ({ message: 'Le type de canal n\'est pas valide' }),
  }),
  username: z
    .string()
    .max(255, 'Le nom d\'utilisateur est trop long')
    .trim()
    .optional()
    .nullable(),
  externalIdentifier: z
    .string()
    .max(255, 'L\'identifiant externe est trop long')
    .trim()
    .optional()
    .nullable(),
})

/**
 * Schéma pour les filtres de recherche de contacts
 */
export const contactFilterSchema = z.object({
  search: z.string().trim().optional(),
  statusId: z.string().uuid().optional(),
  sourceId: z.string().uuid().optional(),
  riskLevel: z.enum(riskLevels).optional(),
  favorite: z.boolean().optional(),
  sortBy: z
    .enum(['firstName', 'lastName', 'createdAt', 'lastInteractionAt'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
})

// Types inférés
export type CreateContactInput = z.infer<typeof createContactSchema>
export type UpdateContactInput = z.infer<typeof updateContactSchema>
export type CreateContactChannelInput = z.infer<typeof createContactChannelSchema>
export type ContactFilterInput = z.infer<typeof contactFilterSchema>

/**
 * Fonction utilitaire pour normaliser un numéro de téléphone
 */
export function normalizePhoneNumber(phone: string): string | null {
  if (!phone || phone.trim() === '') return null
  try {
    const phoneNumber = parsePhoneNumber(phone)
    return phoneNumber.format('E.164')
  } catch {
    return null
  }
}

/**
 * Fonction utilitaire pour détecter les doublons potentiels
 * Retourne true si les contacts sont considérés comme des doublons
 */
export function isDuplicateContact(
  contact1: { phone?: string | null; email?: string | null },
  contact2: { phone?: string | null; email?: string | null }
): boolean {
  // Vérification par téléphone (normalisé)
  if (contact1.phone && contact2.phone) {
    const phone1 = normalizePhoneNumber(contact1.phone)
    const phone2 = normalizePhoneNumber(contact2.phone)
    if (phone1 && phone2 && phone1 === phone2) {
      return true
    }
  }

  // Vérification par email (insensible à la casse)
  if (contact1.email && contact2.email) {
    const email1 = contact1.email.toLowerCase().trim()
    const email2 = contact2.email.toLowerCase().trim()
    if (email1 === email2) {
      return true
    }
  }

  return false
}
