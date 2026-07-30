import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

/**
 * Client Supabase pour les Server Components et Server Actions
 * Utilisé dans les composants React côté serveur et les API routes
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(
          cookiesToSet: Array<{
            name: string
            value: string
            options: Parameters<typeof cookieStore.set>[2]
          }>
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // La méthode `setAll` a été appelée depuis un Server Component.
            // Cela peut être ignoré si vous avez un middleware qui rafraîchit
            // les sessions utilisateur.
          }
        },
      },
    }
  )
}
