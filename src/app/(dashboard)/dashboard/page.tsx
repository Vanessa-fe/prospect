import { getUserProfile } from '@/lib/queries/user-profile'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const profile = await getUserProfile()

  if (!profile) {
    redirect('/login')
  }

  if (!profile.onboarding_completed) {
    redirect('/onboarding')
  }

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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">0</div>
          <p className="text-xs text-muted-foreground">Total contacts</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">0</div>
          <p className="text-xs text-muted-foreground">Nouveaux ce mois</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">0</div>
          <p className="text-xs text-muted-foreground">Rendez-vous aujourd&apos;hui</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">0 €</div>
          <p className="text-xs text-muted-foreground">CA ce mois</p>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Démarrage rapide</h2>
        <p className="text-sm text-muted-foreground">
          Commencez par ajouter votre premier contact pour démarrer.
        </p>
      </div>
    </div>
  )
}
