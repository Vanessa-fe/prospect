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
  createAgencyInteractionSchema,
  agencyInteractionTypes,
  agencyInteractionChannels,
  type CreateAgencyInteractionInput,
} from '@/lib/validations/agency-interaction'
import { interactionTypeLabels, interactionChannelLabels } from '@/lib/validations/interaction'
import { createAgencyInteraction } from '@/lib/actions/agency-interactions'
import { useToast } from '@/lib/hooks/use-toast'
import { Plus, MessageSquare, Phone, FileText } from 'lucide-react'

interface AgencyInteractionFormProps {
  agencyId: string
}

const interactionTypeIcons: Record<string, React.ReactNode> = {
  message: <MessageSquare className="w-4 h-4" />,
  call_incoming: <Phone className="w-4 h-4" />,
  call_outgoing: <Phone className="w-4 h-4" />,
  call_missed: <Phone className="w-4 h-4" />,
  note: <FileText className="w-4 h-4" />,
  reminder: <FileText className="w-4 h-4" />,
  system_event: <FileText className="w-4 h-4" />,
}

export function AgencyInteractionForm({ agencyId }: AgencyInteractionFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<CreateAgencyInteractionInput>({
    resolver: zodResolver(createAgencyInteractionSchema),
    defaultValues: {
      agencyId,
      occurredAt: new Date(),
    },
  })

  const selectedType = watch('type')
  const selectedChannel = watch('channel')

  const isCall = selectedType?.startsWith('call_')
  const needsContent = selectedType === 'message' || selectedType === 'note'
  const needsDuration = isCall

  const onSubmit = async (data: CreateAgencyInteractionInput) => {
    setIsLoading(true)

    const result = await createAgencyInteraction(data)

    if (!result.success) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: result.error || 'Une erreur est survenue',
      })
    } else {
      toast({
        title: 'Succès',
        description: 'Interaction ajoutée avec succès',
      })
      setIsDialogOpen(false)
      reset({ agencyId, occurredAt: new Date() })
      router.refresh()
    }

    setIsLoading(false)
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Ajouter une interaction
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajouter une interaction</DialogTitle>
          <DialogDescription>
            Enregistrez un appel, un message ou une note concernant cette agence
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            {/* Type d'interaction */}
            <div className="space-y-2">
              <Label htmlFor="type">
                Type d&apos;interaction <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedType}
                onValueChange={(value) => setValue('type', value as never)}
                disabled={isLoading}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {agencyInteractionTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        {interactionTypeIcons[type]}
                        {interactionTypeLabels[type]}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
            </div>

            {/* Date et heure */}
            <div className="space-y-2">
              <Label htmlFor="occurredAt">
                Date et heure <span className="text-destructive">*</span>
              </Label>
              <Input
                id="occurredAt"
                type="datetime-local"
                disabled={isLoading}
                {...register('occurredAt', {
                  setValueAs: (value) => (value ? new Date(value) : new Date()),
                })}
              />
              {errors.occurredAt && (
                <p className="text-sm text-destructive">{errors.occurredAt.message}</p>
              )}
            </div>

            {/* Canal (optionnel) */}
            <div className="space-y-2">
              <Label htmlFor="channel">Canal</Label>
              <Select
                value={selectedChannel ?? undefined}
                onValueChange={(value) => setValue('channel', value as never)}
                disabled={isLoading}
              >
                <SelectTrigger id="channel">
                  <SelectValue placeholder="Sélectionner un canal (optionnel)" />
                </SelectTrigger>
                <SelectContent>
                  {agencyInteractionChannels.map((channel) => (
                    <SelectItem key={channel} value={channel}>
                      {interactionChannelLabels[channel]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.channel && (
                <p className="text-sm text-destructive">{errors.channel.message}</p>
              )}
            </div>

            {/* Direction (pour les appels) */}
            {isCall && (
              <div className="space-y-2">
                <Label htmlFor="direction">
                  Direction <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watch('direction') ?? undefined}
                  onValueChange={(value) => setValue('direction', value as never)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="direction">
                    <SelectValue placeholder="Sélectionner une direction" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="incoming">Entrant</SelectItem>
                    <SelectItem value="outgoing">Sortant</SelectItem>
                  </SelectContent>
                </Select>
                {errors.direction && (
                  <p className="text-sm text-destructive">{errors.direction.message}</p>
                )}
              </div>
            )}

            {/* Durée (pour les appels) */}
            {needsDuration && (
              <div className="space-y-2">
                <Label htmlFor="duration">Durée (en secondes)</Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="120"
                  disabled={isLoading}
                  {...register('duration', { valueAsNumber: true })}
                />
                {errors.duration && (
                  <p className="text-sm text-destructive">{errors.duration.message}</p>
                )}
              </div>
            )}

            {/* Contenu */}
            <div className="space-y-2">
              <Label htmlFor="content">
                {needsContent ? (
                  <>
                    Contenu <span className="text-destructive">*</span>
                  </>
                ) : (
                  'Contenu (optionnel)'
                )}
              </Label>
              <textarea
                id="content"
                rows={4}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder={
                  needsContent
                    ? 'Contenu du message ou de la note...'
                    : 'Notes complémentaires...'
                }
                disabled={isLoading}
                {...register('content')}
              />
              {errors.content && (
                <p className="text-sm text-destructive">{errors.content.message}</p>
              )}
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
              {isLoading ? 'Ajout...' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
