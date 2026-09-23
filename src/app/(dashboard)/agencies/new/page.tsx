import { AgencyForm } from '@/components/agencies/agency-form'
import { getAgencyStatuses, getAgencySources } from '@/lib/queries/agencies'

export default async function NewAgencyPage() {
  const [statuses, sources] = await Promise.all([getAgencyStatuses(), getAgencySources()])

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Nouvelle agence</h1>
        <p className="text-muted-foreground mt-2">Ajoutez une agence à prospecter</p>
      </div>
      <AgencyForm statuses={statuses} sources={sources} />
    </div>
  )
}
