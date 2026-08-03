import { ContactsList } from '@/components/contacts/contacts-list'
import {
  getContacts,
  getContactStatuses,
  getContactSources,
  getContactsCount,
} from '@/lib/queries/contacts'

export default async function ContactsPage() {
  const [contacts, statuses, sources, totalCount] = await Promise.all([
    getContacts({ limit: 100 }),
    getContactStatuses(),
    getContactSources(),
    getContactsCount(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Contacts</h1>
        <p className="text-muted-foreground mt-2">Gérez vos prospects et clients</p>
      </div>
      <ContactsList
        contacts={contacts}
        statuses={statuses}
        sources={sources}
        totalCount={totalCount}
      />
    </div>
  )
}
