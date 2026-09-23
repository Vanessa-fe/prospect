import { notFound } from 'next/navigation'
import { AgencyDetail } from '@/components/agencies/agency-detail'
import { getAgencyById } from '@/lib/queries/agencies'
import { getAgencyInteractions } from '@/lib/queries/agency-interactions'
import { getAgencyReminders } from '@/lib/queries/reminders'

interface AgencyPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function AgencyPage({ params }: AgencyPageProps) {
  const { id } = await params
  const [agency, interactions, reminders] = await Promise.all([
    getAgencyById(id),
    getAgencyInteractions(id),
    getAgencyReminders(id),
  ])

  if (!agency) {
    notFound()
  }

  return <AgencyDetail agency={agency} interactions={interactions} reminders={reminders} />
}
