import { z } from 'zod'

export const paymentMethods = ['cash', 'card', 'transfer', 'check', 'paypal', 'other'] as const
export const paymentStatuses = ['pending', 'partial', 'paid', 'refunded'] as const

export type PaymentMethod = (typeof paymentMethods)[number]
export type PaymentStatus = (typeof paymentStatuses)[number]

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: 'Espèces',
  card: 'Carte bancaire',
  transfer: 'Virement',
  check: 'Chèque',
  paypal: 'PayPal',
  other: 'Autre',
}

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending: 'En attente',
  partial: 'Partiel',
  paid: 'Payé',
  refunded: 'Remboursé',
}

export const paymentStatusColors: Record<PaymentStatus, string> = {
  pending: 'text-yellow-600',
  partial: 'text-blue-600',
  paid: 'text-green-600',
  refunded: 'text-gray-600',
}

const basePaymentSchema = z.object({
  contactId: z.string().uuid(),
  appointmentId: z.string().uuid().optional().nullable(),
  amount: z.coerce.number().min(0, 'Le montant doit être positif'),
  depositAmount: z.coerce.number().min(0, 'L\'acompte doit être positif').optional().default(0),
  paymentMethod: z.enum(paymentMethods).optional().nullable(),
  paymentStatus: z.enum(paymentStatuses).default('pending'),
  paidAt: z.coerce.date().optional().nullable(),
  notes: z.string().max(2000).trim().optional().nullable(),
})

export const createPaymentSchema = basePaymentSchema.refine(
  (data) => {
    if (data.depositAmount !== undefined && data.depositAmount > data.amount) {
      return false
    }
    return true
  },
  {
    message: 'L\'acompte ne peut pas être supérieur au montant total',
    path: ['depositAmount'],
  }
)

export const updatePaymentSchema = basePaymentSchema.partial().omit({ contactId: true })

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>

// Utilitaires
export function getRemainingAmount(amount: number, depositAmount: number): number {
  return Math.max(0, amount - depositAmount)
}

export function getPaymentProgress(amount: number, depositAmount: number): number {
  if (amount === 0) return 0
  return Math.min(100, (depositAmount / amount) * 100)
}

export function getAutomaticPaymentStatus(amount: number, depositAmount: number): PaymentStatus {
  if (depositAmount === 0) return 'pending'
  if (depositAmount >= amount) return 'paid'
  return 'partial'
}
