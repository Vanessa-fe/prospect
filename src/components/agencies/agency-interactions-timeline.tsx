'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { deleteAgencyInteraction } from '@/lib/actions/agency-interactions'
import { useToast } from '@/lib/hooks/use-toast'
import type { AgencyInteraction } from '@/types'
import {
  MessageSquare,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  FileText,
  Bell,
  Activity,
  Trash2,
  Clock,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  interactionTypeLabels,
  interactionChannelLabels,
  formatDuration,
} from '@/lib/validations/interaction'
import { AgencyInteractionForm } from './agency-interaction-form'

interface AgencyInteractionsTimelineProps {
  agencyId: string
  interactions: AgencyInteraction[]
}

const interactionIcons: Record<string, React.ReactNode> = {
  message: <MessageSquare className="w-5 h-5" />,
  call_incoming: <PhoneIncoming className="w-5 h-5" />,
  call_outgoing: <PhoneOutgoing className="w-5 h-5" />,
  call_missed: <PhoneMissed className="w-5 h-5" />,
  note: <FileText className="w-5 h-5" />,
  reminder: <Bell className="w-5 h-5" />,
  system_event: <Activity className="w-5 h-5" />,
}

const interactionColors: Record<string, string> = {
  message: 'text-blue-500 bg-blue-50 dark:bg-blue-950',
  call_incoming: 'text-green-500 bg-green-50 dark:bg-green-950',
  call_outgoing: 'text-purple-500 bg-purple-50 dark:bg-purple-950',
  call_missed: 'text-red-500 bg-red-50 dark:bg-red-950',
  note: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950',
  reminder: 'text-orange-500 bg-orange-50 dark:bg-orange-950',
  system_event: 'text-gray-500 bg-gray-50 dark:bg-gray-950',
}

export function AgencyInteractionsTimeline({
  agencyId,
  interactions,
}: AgencyInteractionsTimelineProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (interactionId: string, interactionType: string) => {
    if (
      !confirm(
        `Êtes-vous sûr de vouloir supprimer cette interaction (${interactionTypeLabels[interactionType as keyof typeof interactionTypeLabels]}) ?`
      )
    ) {
      return
    }

    setDeletingId(interactionId)

    const result = await deleteAgencyInteraction(interactionId)

    if (!result.success) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: result.error || 'Une erreur est survenue',
      })
    } else {
      toast({
        title: 'Succès',
        description: 'Interaction supprimée avec succès',
      })
      router.refresh()
    }

    setDeletingId(null)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Historique des interactions</CardTitle>
            <CardDescription>
              {interactions.length} interaction{interactions.length !== 1 ? 's' : ''} enregistrée
              {interactions.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <AgencyInteractionForm agencyId={agencyId} />
        </div>
      </CardHeader>
      <CardContent>
        {interactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Aucune interaction enregistrée</p>
            <p className="text-sm text-muted-foreground mt-2">
              Ajoutez votre première interaction pour commencer à suivre l&apos;historique de vos
              échanges
            </p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-[23px] top-0 bottom-0 w-0.5 bg-border" />

            <div className="space-y-6">
              {interactions.map((interaction) => {
                const occurredDate = new Date(interaction.occurred_at)

                return (
                  <div key={interaction.id} className="relative flex gap-4 group">
                    <div
                      className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 border-background ${interactionColors[interaction.type]}`}
                    >
                      {interactionIcons[interaction.type]}
                    </div>

                    <div className="flex-1 pb-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">
                              {
                                interactionTypeLabels[
                                  interaction.type as keyof typeof interactionTypeLabels
                                ]
                              }
                            </h4>
                            {interaction.channel && (
                              <span className="text-sm text-muted-foreground">
                                •{' '}
                                {
                                  interactionChannelLabels[
                                    interaction.channel as keyof typeof interactionChannelLabels
                                  ]
                                }
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <Clock className="w-3 h-3" />
                            <time dateTime={interaction.occurred_at}>
                              {format(occurredDate, 'dd MMMM yyyy à HH:mm', { locale: fr })}
                            </time>
                            <span className="text-xs">
                              ({formatDistanceToNow(occurredDate, { addSuffix: true, locale: fr })})
                            </span>
                          </div>

                          <div className="space-y-1 mb-2">
                            {interaction.duration !== null && interaction.duration !== undefined && (
                              <p className="text-sm text-muted-foreground">
                                Durée : {formatDuration(interaction.duration)}
                              </p>
                            )}
                            {interaction.direction && (
                              <p className="text-sm text-muted-foreground">
                                Direction :{' '}
                                {interaction.direction === 'incoming' ? 'Entrant' : 'Sortant'}
                              </p>
                            )}
                          </div>

                          {interaction.content && (
                            <div className="mt-2 p-3 rounded-lg bg-muted">
                              <p className="text-sm whitespace-pre-wrap">{interaction.content}</p>
                            </div>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(interaction.id, interaction.type)}
                          disabled={deletingId === interaction.id}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
