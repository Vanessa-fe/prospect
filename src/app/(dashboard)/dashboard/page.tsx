import { getUserProfile } from '@/lib/queries/user-profile'
import { redirect } from 'next/navigation'
import { getDashboardStats, getContactsByStatus, getContactsBySource } from '@/lib/queries/dashboard'
import { getContacts } from '@/lib/queries/contacts'
import { getUpcomingAppointments } from '@/lib/queries/appointments'
import { getOverdueReminders } from '@/lib/queries/reminders'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { Charts } from '@/components/dashboard/charts'
import { RecentContacts } from '@/components/dashboard/recent-contacts'
import { UpcomingAppointments } from '@/components/dashboard/upcoming-appointments'
import { OverdueReminders } from '@/components/dashboard/overdue-reminders'

export default async function DashboardPage() {
  const profile = await getUserProfile()

  if (!profile) {
    redirect('/login')
  }

  if (!profile.onboarding_completed) {
    redirect('/onboarding')
  }

  // Charger toutes les données du dashboard
  const [stats, contactsByStatus, contactsBySource, recentContacts, upcomingAppointments, overdueReminders] =
    await Promise.all([
      getDashboardStats(),
      getContactsByStatus(),
      getContactsBySource(),
      getContacts({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
      getUpcomingAppointments(5),
      getOverdueReminders(),
    ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Bienvenue, {profile.first_name || 'Utilisateur'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {profile.business_name && `${profile.business_name} - `}
          Voici un aperçu de votre activité
        </p>
      </div>

      {/* Cartes de statistiques */}
      <StatsCards stats={stats} />

      {/* Graphiques */}
      <Charts contactsByStatus={contactsByStatus} contactsBySource={contactsBySource} />

      {/* Widgets */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <RecentContacts contacts={recentContacts} />
        <UpcomingAppointments appointments={upcomingAppointments} />
        <OverdueReminders reminders={overdueReminders} />
      </div>
    </div>
  )
}
