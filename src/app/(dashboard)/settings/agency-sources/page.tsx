import { Suspense } from 'react'
import Link from 'next/link'
import { getAllAgencySources } from '@/lib/queries/agency-sources'
import { deleteAgencySource } from '@/lib/actions/agency-sources'
import { AgencySourceFormDialog } from '@/components/settings/agency-source-form-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, ArrowLeft, Tag } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function AgencySourcesContent() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const sources = await getAllAgencySources()

  async function handleDelete(formData: FormData) {
    'use server'
    const sourceId = formData.get('sourceId') as string
    await deleteAgencySource(sourceId)
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
            <h1 className="text-3xl font-bold">Sources des agences</h1>
            <p className="text-muted-foreground mt-1">
              Personnalisez les sources de vos agences
            </p>
          </div>
        </div>
        <AgencySourceFormDialog />
      </div>

      {sources.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">Aucune source créée</p>
            <AgencySourceFormDialog />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sources.map((source, index) => (
            <Card
              key={source.id}
              className="hover-lift animate-slide-in-bottom"
              style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'both' }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Tag className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{source.name}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <AgencySourceFormDialog source={source} />
                  <form action={handleDelete}>
                    <input type="hidden" name="sourceId" value={source.id} />
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

export default function AgencySourcesPage() {
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
      <AgencySourcesContent />
    </Suspense>
  )
}
