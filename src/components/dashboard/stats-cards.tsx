import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DashboardStats } from '@/types'
import { Users, UserPlus, Calendar, Bell, DollarSign } from 'lucide-react'

interface StatsCardsProps {
  stats: DashboardStats
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Contacts',
      value: stats.totalContacts,
      icon: Users,
      description: 'Contacts dans votre base',
    },
    {
      title: 'Nouveaux ce mois',
      value: stats.newContactsThisMonth,
      icon: UserPlus,
      description: 'Contacts ajoutés ce mois',
    },
    {
      title: 'RDV Aujourd\'hui',
      value: stats.appointmentsToday,
      icon: Calendar,
      description: 'Rendez-vous du jour',
    },
    {
      title: 'Relances en retard',
      value: stats.overdueReminders,
      icon: Bell,
      description: 'À traiter en priorité',
      alert: stats.overdueReminders > 0,
    },
    {
      title: 'CA du mois',
      value: `${stats.revenueThisMonth.toFixed(2)} €`,
      icon: DollarSign,
      description: 'Chiffre d\'affaires mensuel',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <Card
            key={card.title}
            className="hover-lift animate-slide-in-bottom overflow-hidden relative"
            style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'both' }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <div className={`p-2 rounded-full ${card.alert ? 'bg-red-100' : 'bg-primary/10'}`}>
                <Icon className={`h-4 w-4 ${card.alert ? 'text-red-500 animate-pulse-soft' : 'text-primary'}`} />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className={`text-2xl font-bold ${card.alert ? 'text-red-500' : ''}`}>
                {card.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
