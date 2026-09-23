'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/lib/hooks/use-toast'
import { createAgencyStatus, updateAgencyStatusSetting } from '@/lib/actions/agency-statuses'
import type { AgencyStatus } from '@/types'
import { Plus, Edit } from 'lucide-react'

interface AgencyStatusFormDialogProps {
  status?: AgencyStatus
  trigger?: React.ReactNode
}

const colorPresets = [
  { name: 'Bleu', value: '#3b82f6' },
  { name: 'Vert', value: '#10b981' },
  { name: 'Jaune', value: '#f59e0b' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Rouge', value: '#ef4444' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Rose', value: '#ec4899' },
  { name: 'Turquoise', value: '#14b8a6' },
  { name: 'Indigo', value: '#6366f1' },
]

export function AgencyStatusFormDialog({ status, trigger }: AgencyStatusFormDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState(status?.name || '')
  const [color, setColor] = useState(status?.color || '#3b82f6')
  const [isDefault, setIsDefault] = useState(status?.is_default || false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const data = { name, color, isDefault }
    const result = status
      ? await updateAgencyStatusSetting(status.id, data)
      : await createAgencyStatus(data)

    if (result.success) {
      toast({
        title: 'Succès',
        description: status ? 'Statut mis à jour' : 'Statut créé',
      })
      setOpen(false)
      setName('')
      setColor('#3b82f6')
      setIsDefault(false)
      router.refresh()
    } else {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: result.error || 'Une erreur est survenue',
      })
    }

    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size={status ? 'sm' : 'default'} variant={status ? 'ghost' : 'default'}>
            {status ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4 mr-2" />}
            {!status && 'Nouveau statut'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{status ? 'Modifier le statut' : 'Créer un statut'}</DialogTitle>
            <DialogDescription>
              {status
                ? 'Modifiez les informations du statut'
                : 'Créez un nouveau statut pour vos agences'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du statut</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: À contacter"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Couleur</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <div className="flex flex-wrap gap-2">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setColor(preset.value)}
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
                      style={{ backgroundColor: preset.value }}
                      title={preset.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isDefault"
                checked={isDefault}
                onCheckedChange={(checked) => setIsDefault(checked as boolean)}
              />
              <Label htmlFor="isDefault" className="cursor-pointer">
                Statut par défaut
              </Label>
            </div>

            <div className="p-4 border rounded-lg">
              <p className="text-sm font-medium mb-2">Aperçu</p>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span>{name || 'Nom du statut'}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading || !name}>
              {isLoading ? 'Enregistrement...' : status ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
