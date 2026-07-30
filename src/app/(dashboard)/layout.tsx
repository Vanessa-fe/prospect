import { getUserProfile } from '@/lib/queries/user-profile'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getUserProfile()

  if (!profile) {
    redirect('/login')
  }

  if (!profile.onboarding_completed) {
    redirect('/onboarding')
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:pl-64">
        <main className="p-4 md:p-8 pb-20 md:pb-8">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
