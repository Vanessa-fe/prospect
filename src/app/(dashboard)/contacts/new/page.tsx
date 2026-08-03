import { ContactForm } from '@/components/contacts/contact-form'
import { getContactStatuses, getContactSources } from '@/lib/queries/contacts'

export default async function NewContactPage() {
  const [statuses, sources] = await Promise.all([getContactStatuses(), getContactSources()])

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Nouveau contact</h1>
        <p className="text-muted-foreground mt-2">Ajoutez un nouveau prospect ou client</p>
      </div>
      <ContactForm statuses={statuses} sources={sources} />
    </div>
  )
}
