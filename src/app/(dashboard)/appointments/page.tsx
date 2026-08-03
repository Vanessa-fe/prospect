import { AppointmentsList } from '@/components/appointments/appointments-list'
import { getAppointments, getAppointmentsCount } from '@/lib/queries/appointments'

export default async function AppointmentsPage() {
  const [appointments, totalCount] = await Promise.all([
    getAppointments({ limit: 100 }),
    getAppointmentsCount(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Rendez-vous</h1>
        <p className="text-muted-foreground mt-2">Gérez votre agenda et vos rendez-vous</p>
      </div>
      <AppointmentsList appointments={appointments} totalCount={totalCount} />
    </div>
  )
}
