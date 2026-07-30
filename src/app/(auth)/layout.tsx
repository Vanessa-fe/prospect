import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Connexion - Prospect CRM',
  description: 'Connectez-vous à votre compte Prospect CRM',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
