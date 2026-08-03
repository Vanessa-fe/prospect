import { notFound } from 'next/navigation'
import { ContactForm } from '@/components/contacts/contact-form'
import { getContactById, getContactStatuses, getContactSources } from '@/lib/queries/contacts'

interface EditContactPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditContactPage({ params }: EditContactPageProps) {
  const { id } = await params
  const [contact, statuses, sources] = await Promise.all([
    getContactById(id),
    getContactStatuses(),
    getContactSources(),
  ])

  if (!contact) {
    notFound()
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Modifier le contact</h1>
        <p className="text-muted-foreground mt-2">
          Mettez à jour les informations de{' '}
          {[contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'ce contact'}
        </p>
      </div>
      <ContactForm contact={contact} statuses={statuses} sources={sources} />
    </div>
  )
}
