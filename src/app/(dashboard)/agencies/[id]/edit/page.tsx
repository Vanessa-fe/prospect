import { notFound } from 'next/navigation'
import { AgencyForm } from '@/components/agencies/agency-form'
import { getAgencyById, getAgencyStatuses, getAgencySources } from '@/lib/queries/agencies'

interface EditAgencyPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditAgencyPage({ params }: EditAgencyPageProps) {
  const { id } = await params
  const [agency, statuses, sources] = await Promise.all([
    getAgencyById(id),
    getAgencyStatuses(),
    getAgencySources(),
  ])

  if (!agency) {
    notFound()
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Modifier l&apos;agence</h1>
        <p className="text-muted-foreground mt-2">Mettez à jour les informations de {agency.name}</p>
      </div>
      <AgencyForm agency={agency} statuses={statuses} sources={sources} />
    </div>
  )
}
