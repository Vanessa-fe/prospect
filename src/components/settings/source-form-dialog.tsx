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
import { useToast } from '@/lib/hooks/use-toast'
import { createSource, updateSource } from '@/lib/actions/sources'
import type { ContactSource } from '@/types'
import { Plus, Edit } from 'lucide-react'

interface SourceFormDialogProps {
  source?: ContactSource
  trigger?: React.ReactNode
}

export function SourceFormDialog({ source, trigger }: SourceFormDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState(source?.name || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const result = source
      ? await updateSource(source.id, { name })
      : await createSource({ name })

    if (result.success) {
      toast({
        title: 'Succès',
        description: source ? 'Source mise à jour' : 'Source créée',
      })
      setOpen(false)
      setName('')
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
          <Button size={source ? 'sm' : 'default'} variant={source ? 'ghost' : 'default'}>
            {source ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4 mr-2" />}
            {!source && 'Nouvelle source'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{source ? 'Modifier la source' : 'Créer une source'}</DialogTitle>
            <DialogDescription>
              {source
                ? 'Modifiez le nom de la source'
                : 'Créez une nouvelle source pour vos contacts'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la source</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Recommandation, LinkedIn, Site web..."
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading || !name}>
              {isLoading ? 'Enregistrement...' : source ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
