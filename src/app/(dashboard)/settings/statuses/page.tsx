import { Suspense } from 'react'
import Link from 'next/link'
import { getAllStatuses } from '@/lib/queries/statuses'
import { deleteStatus } from '@/lib/actions/statuses'
import { StatusFormDialog } from '@/components/settings/status-form-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, ArrowLeft } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function StatusesContent() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const statuses = await getAllStatuses()

  async function handleDelete(formData: FormData) {
    'use server'
    const statusId = formData.get('statusId') as string
    await deleteStatus(statusId)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/settings">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Gestion des statuts</h1>
            <p className="text-muted-foreground mt-1">
              Personnalisez les statuts de vos contacts
            </p>
          </div>
        </div>
        <StatusFormDialog />
      </div>

      {statuses.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">Aucun statut créé</p>
            <StatusFormDialog />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {statuses.map((status, index) => (
            <Card
              key={status.id}
              className="hover-lift animate-slide-in-bottom"
              style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'both' }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-full shadow-sm"
                      style={{ backgroundColor: status.color }}
                    />
                    <div>
                      <CardTitle className="text-lg">{status.name}</CardTitle>
                      {status.is_default && (
                        <Badge variant="secondary" className="mt-1">
                          Par défaut
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <StatusFormDialog status={status} />
                  <form action={handleDelete}>
                    <input type="hidden" name="statusId" value={status.id} />
                    <Button type="submit" variant="ghost" size="sm">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default function StatusesPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-10 w-64 skeleton rounded" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 skeleton rounded-lg" />
            ))}
          </div>
        </div>
      }
    >
      <StatusesContent />
    </Suspense>
  )
}
