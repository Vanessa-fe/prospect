'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createPayment } from '@/lib/actions/payments'
import { useToast } from '@/lib/hooks/use-toast'
import {
  createPaymentSchema,
  paymentMethods,
  paymentStatuses,
  paymentMethodLabels,
  paymentStatusLabels,
  type CreatePaymentInput,
} from '@/lib/validations/payment'
import { Plus } from 'lucide-react'

interface PaymentFormDialogProps {
  contactId: string
  appointmentId?: string
}

export function PaymentFormDialog({ contactId, appointmentId }: PaymentFormDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<CreatePaymentInput>({
    resolver: zodResolver(createPaymentSchema),
    defaultValues: {
      contactId,
      appointmentId: appointmentId ?? undefined,
      amount: 0,
      depositAmount: 0,
      paymentStatus: 'pending',
    },
  })

  const selectedMethod = watch('paymentMethod')
  const selectedStatus = watch('paymentStatus')

  const onSubmit = async (data: CreatePaymentInput) => {
    setIsSubmitting(true)

    const result = await createPayment(data)

    if (result.success) {
      toast({
        title: 'Succès',
        description: 'Paiement enregistré avec succès',
      })
      setOpen(false)
      reset()
      router.refresh()
    } else {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: result.error || 'Une erreur est survenue',
      })
    }

    setIsSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau paiement
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enregistrer un paiement</DialogTitle>
          <DialogDescription>
            Enregistrez un nouveau paiement pour ce contact
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Montant */}
            <div className="space-y-2">
              <Label htmlFor="amount">
                Montant total <span className="text-red-500">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                {...register('amount')}
                placeholder="0.00"
              />
              {errors.amount && (
                <p className="text-sm text-red-500">{errors.amount.message}</p>
              )}
            </div>

            {/* Acompte */}
            <div className="space-y-2">
              <Label htmlFor="depositAmount">Acompte versé</Label>
              <Input
                id="depositAmount"
                type="number"
                step="0.01"
                min="0"
                {...register('depositAmount')}
                placeholder="0.00"
              />
              {errors.depositAmount && (
                <p className="text-sm text-red-500">{errors.depositAmount.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Méthode de paiement */}
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Méthode de paiement</Label>
              <Select
                value={selectedMethod ?? undefined}
                onValueChange={(value) => setValue('paymentMethod', value as never)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method} value={method}>
                      {paymentMethodLabels[method]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Statut */}
            <div className="space-y-2">
              <Label htmlFor="paymentStatus">Statut</Label>
              <Select
                value={selectedStatus}
                onValueChange={(value) => setValue('paymentStatus', value as never)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {paymentStatusLabels[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date de paiement */}
          <div className="space-y-2">
            <Label htmlFor="paidAt">Date de paiement</Label>
            <Input
              id="paidAt"
              type="datetime-local"
              {...register('paidAt')}
            />
            {errors.paidAt && (
              <p className="text-sm text-red-500">{errors.paidAt.message}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Informations complémentaires..."
              rows={3}
            />
            {errors.notes && (
              <p className="text-sm text-red-500">{errors.notes.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
