import { RemindersList } from '@/components/reminders/reminders-list'
import { getReminders, getRemindersCount } from '@/lib/queries/reminders'

export default async function RemindersPage() {
  const [reminders, totalCount] = await Promise.all([
    getReminders({ limit: 100 }),
    getRemindersCount(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Relances</h1>
        <p className="text-muted-foreground mt-2">Gérez vos rappels et relances</p>
      </div>
      <RemindersList reminders={reminders} totalCount={totalCount} />
    </div>
  )
}
