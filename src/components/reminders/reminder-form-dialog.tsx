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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createReminder } from '@/lib/actions/reminders'
import { useToast } from '@/lib/hooks/use-toast'
import {
  createReminderSchema,
  reminderPriorities,
  reminderPriorityLabels,
  type CreateReminderInput,
} from '@/lib/validations/reminder'
import { Plus, Bell } from 'lucide-react'

interface ReminderFormDialogProps {
  contactId?: string
  agencyId?: string
  triggerVariant?: 'default' | 'icon'
}

export function ReminderFormDialog({ contactId, agencyId, triggerVariant = 'default' }: ReminderFormDialogProps) {
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
  } = useForm<CreateReminderInput>({
    resolver: zodResolver(createReminderSchema),
    defaultValues: {
      contactId: contactId ?? undefined,
      agencyId: agencyId ?? undefined,
      priority: 'medium',
    },
  })

  const selectedPriority = watch('priority')

  const onSubmit = async (data: CreateReminderInput) => {
    setIsSubmitting(true)

    const result = await createReminder(data)

    if (result.success) {
      toast({
        title: 'Succès',
        description: 'Relance créée avec succès',
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
        {triggerVariant === 'icon' ? (
          <Button size="sm" variant="outline">
            <Bell className="w-4 h-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle relance
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Créer une relance</DialogTitle>
          <DialogDescription>
            Créez un rappel pour ne rien oublier
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Titre */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Titre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Rappeler le client..."
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Date d'échéance */}
            <div className="space-y-2">
              <Label htmlFor="dueAt">
                Date d&apos;échéance <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dueAt"
                type="datetime-local"
                {...register('dueAt')}
              />
              {errors.dueAt && (
                <p className="text-sm text-red-500">{errors.dueAt.message}</p>
              )}
            </div>

            {/* Priorité */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priorité</Label>
              <Select
                value={selectedPriority}
                onValueChange={(value) => setValue('priority', value as never)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reminderPriorities.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {reminderPriorityLabels[priority]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              {isSubmitting ? 'Création...' : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
