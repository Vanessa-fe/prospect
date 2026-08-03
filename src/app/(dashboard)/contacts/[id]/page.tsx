import { notFound } from 'next/navigation'
import { ContactDetail } from '@/components/contacts/contact-detail'
import { getContactById } from '@/lib/queries/contacts'
import { getContactInteractions } from '@/lib/queries/interactions'
import { getContactAppointments } from '@/lib/queries/appointments'
import { getContactPayments } from '@/lib/queries/payments'

interface ContactPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { id } = await params
  const [contact, interactions, appointments, payments] = await Promise.all([
    getContactById(id),
    getContactInteractions(id),
    getContactAppointments(id),
    getContactPayments(id),
  ])

  if (!contact) {
    notFound()
  }

  return (
    <ContactDetail
      contact={contact}
      interactions={interactions}
      appointments={appointments}
      payments={payments}
    />
  )
}
