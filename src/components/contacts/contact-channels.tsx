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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  createContactChannelSchema,
  type CreateContactChannelInput,
  channelTypes,
} from '@/lib/validations/contact'
import { addContactChannel, deleteContactChannel } from '@/lib/actions/contacts'
import { useToast } from '@/lib/hooks/use-toast'
import type { ContactChannel } from '@/types'
import { Plus, Trash2, MessageSquare, Phone, Mail } from 'lucide-react'

interface ContactChannelsProps {
  contactId: string
  channels: ContactChannel[]
}

const channelIcons: Record<string, React.ReactNode> = {
  whatsapp: <MessageSquare className="w-4 h-4" />,
  sms: <MessageSquare className="w-4 h-4" />,
  telegram: <MessageSquare className="w-4 h-4" />,
  signal: <MessageSquare className="w-4 h-4" />,
  phone: <Phone className="w-4 h-4" />,
  instagram: <MessageSquare className="w-4 h-4" />,
  email: <Mail className="w-4 h-4" />,
  website: <MessageSquare className="w-4 h-4" />,
  other: <MessageSquare className="w-4 h-4" />,
}

const channelLabels: Record<string, string> = {
  whatsapp: 'WhatsApp',
  sms: 'SMS',
  telegram: 'Telegram',
  signal: 'Signal',
  phone: 'Téléphone',
  instagram: 'Instagram',
  email: 'Email',
  website: 'Site web',
  other: 'Autre',
}

export function ContactChannels({ contactId, channels }: ContactChannelsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<CreateContactChannelInput>({
    resolver: zodResolver(createContactChannelSchema),
    defaultValues: {
      contactId,
    },
  })

  const selectedChannelType = watch('channelType')

  const onSubmit = async (data: CreateContactChannelInput) => {
    setIsLoading(true)

    const result = await addContactChannel(data)

    if (!result.success) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: result.error || 'Une erreur est survenue',
      })
    } else {
      toast({
        title: 'Succès',
        description: 'Canal ajouté avec succès',
      })
      setIsDialogOpen(false)
      reset({ contactId })
      router.refresh()
    }

    setIsLoading(false)
  }

  const handleDelete = async (channelId: string, channelType: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ce canal ${channelLabels[channelType] || channelType} ?`)) {
      return
    }

    setDeletingId(channelId)

    const result = await deleteContactChannel(channelId)

    if (!result.success) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: result.error || 'Une erreur est survenue',
      })
    } else {
      toast({
        title: 'Succès',
        description: 'Canal supprimé avec succès',
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
            <CardTitle>Canaux de communication</CardTitle>
            <CardDescription>
              Plateformes et moyens de contact disponibles
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un canal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un canal de communication</DialogTitle>
                <DialogDescription>
                  Ajoutez un nouveau moyen de contacter ce prospect
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="channelType">
                      Type de canal <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={selectedChannelType}
                      onValueChange={(value) => setValue('channelType', value as any)}
                      disabled={isLoading}
                    >
                      <SelectTrigger id="channelType">
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                      <SelectContent>
                        {channelTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            <div className="flex items-center gap-2">
                              {channelIcons[type]}
                              {channelLabels[type]}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.channelType && (
                      <p className="text-sm text-destructive">{errors.channelType.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Nom d&apos;utilisateur</Label>
                    <Input
                      id="username"
                      placeholder="@username"
                      disabled={isLoading}
                      {...register('username')}
                    />
                    {errors.username && (
                      <p className="text-sm text-destructive">{errors.username.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="externalIdentifier">Identifiant externe</Label>
                    <Input
                      id="externalIdentifier"
                      placeholder="ID, URL ou autre identifiant"
                      disabled={isLoading}
                      {...register('externalIdentifier')}
                    />
                    {errors.externalIdentifier && (
                      <p className="text-sm text-destructive">
                        {errors.externalIdentifier.message}
                      </p>
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
        </div>
      </CardHeader>
      <CardContent>
        {channels.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">
            Aucun canal de communication ajouté
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {channels.map((channel) => (
              <div key={channel.id} className="p-4 rounded-lg border bg-card relative group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {channelIcons[channel.channel_type]}
                    <div>
                      <p className="font-semibold">{channelLabels[channel.channel_type]}</p>
                      {channel.username && (
                        <p className="text-sm text-muted-foreground">@{channel.username}</p>
                      )}
                      {channel.external_identifier && (
                        <p className="text-sm text-muted-foreground truncate max-w-[150px]">
                          {channel.external_identifier}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(channel.id, channel.channel_type)}
                    disabled={deletingId === channel.id}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
