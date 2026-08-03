'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  createAppointmentSchema,
  type CreateAppointmentInput,
  appointmentStatuses,
  appointmentStatusLabels,
} from '@/lib/validations/appointment'
import { createAppointment } from '@/lib/actions/appointments'
import { useToast } from '@/lib/hooks/use-toast'
import type { Contact } from '@/types'
import { Plus, Calendar } from 'lucide-react'
import { format } from 'date-fns'

interface AppointmentFormDialogProps {
  contactId?: string
  contacts?: Contact[]
  triggerButton?: React.ReactNode
}

export function AppointmentFormDialog({
  contactId,
  contacts = [],
  triggerButton,
}: AppointmentFormDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Calculer la date/heure par défaut (demain à 10h)
  const getDefaultStartDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(10, 0, 0, 0)
    return tomorrow
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<CreateAppointmentInput>({
    resolver: zodResolver(createAppointmentSchema),
    defaultValues: {
      contactId: contactId || '',
      status: 'scheduled',
      startAt: getDefaultStartDate(),
    },
  })

  const selectedContactId = watch('contactId')
  const selectedStatus = watch('status')

  const onSubmit = async (data: CreateAppointmentInput) => {
    setIsLoading(true)

    const result = await createAppointment(data)

    if (!result.success) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: result.error || 'Une erreur est survenue',
      })
    } else {
      toast({
        title: 'Succès',
        description: 'Rendez-vous créé avec succès',
      })
      setIsDialogOpen(false)
      reset({
        contactId: contactId || '',
        status: 'scheduled',
        startAt: getDefaultStartDate(),
      })
      router.refresh()
    }

    setIsLoading(false)
  }

  const defaultTrigger = (
    <Button size="sm">
      <Plus className="w-4 h-4 mr-2" />
      Nouveau rendez-vous
    </Button>
  )

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>{triggerButton || defaultTrigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Nouveau rendez-vous
          </DialogTitle>
          <DialogDescription>Planifiez un rendez-vous avec un contact</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            {/* Contact (si pas pré-sélectionné) */}
            {!contactId && contacts.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="contactId">
                  Contact <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={selectedContactId}
                  onValueChange={(value) => setValue('contactId', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="contactId">
                    <SelectValue placeholder="Sélectionner un contact" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {[contact.first_name, contact.last_name].filter(Boolean).join(' ') ||
                          'Sans nom'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.contactId && (
                  <p className="text-sm text-destructive">{errors.contactId.message}</p>
                )}
              </div>
            )}

            {/* Titre */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Titre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Consultation, Rendez-vous..."
                disabled={isLoading}
                {...register('title')}
              />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            {/* Date et heure de début */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startAt">
                  Date et heure de début <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="startAt"
                  type="datetime-local"
                  disabled={isLoading}
                  defaultValue={format(getDefaultStartDate(), "yyyy-MM-dd'T'HH:mm")}
                  {...register('startAt', {
                    setValueAs: (value) => (value ? new Date(value) : getDefaultStartDate()),
                  })}
                />
                {errors.startAt && (
                  <p className="text-sm text-destructive">{errors.startAt.message}</p>
                )}
              </div>

              {/* Date et heure de fin */}
              <div className="space-y-2">
                <Label htmlFor="endAt">Date et heure de fin</Label>
                <Input
                  id="endAt"
                  type="datetime-local"
                  disabled={isLoading}
                  {...register('endAt', {
                    setValueAs: (value) => (value ? new Date(value) : null),
                  })}
                />
                {errors.endAt && (
                  <p className="text-sm text-destructive">{errors.endAt.message}</p>
                )}
              </div>
            </div>

            {/* Lieu */}
            <div className="space-y-2">
              <Label htmlFor="location">Lieu</Label>
              <Input
                id="location"
                placeholder="Adresse, bureau, en ligne..."
                disabled={isLoading}
                {...register('location')}
              />
              {errors.location && (
                <p className="text-sm text-destructive">{errors.location.message}</p>
              )}
            </div>

            {/* Statut */}
            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select
                value={selectedStatus}
                onValueChange={(value) => setValue('status', value as any)}
                disabled={isLoading}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {appointmentStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {appointmentStatusLabels[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-sm text-destructive">{errors.status.message}</p>
              )}
            </div>

            {/* Rappel */}
            <div className="space-y-2">
              <Label htmlFor="reminderAt">Rappel</Label>
              <Input
                id="reminderAt"
                type="datetime-local"
                disabled={isLoading}
                {...register('reminderAt', {
                  setValueAs: (value) => (value ? new Date(value) : null),
                })}
              />
              {errors.reminderAt && (
                <p className="text-sm text-destructive">{errors.reminderAt.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Le rappel doit être programmé avant le rendez-vous
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                rows={4}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Notes supplémentaires..."
                disabled={isLoading}
                {...register('notes')}
              />
              {errors.notes && <p className="text-sm text-destructive">{errors.notes.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Création...' : 'Créer le rendez-vous'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
