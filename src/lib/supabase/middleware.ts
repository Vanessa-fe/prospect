import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database'

/**
 * Client Supabase pour le middleware
 * Gère le rafraîchissement automatique de la session
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(
          cookiesToSet: Array<{
            name: string
            value: string
            options: {
              path?: string
              domain?: string
              maxAge?: number
              expires?: Date
              httpOnly?: boolean
              secure?: boolean
              sameSite?: 'lax' | 'strict' | 'none'
            }
          }>
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Évite d'écrire une logique entre createServerClient et
  // supabase.auth.getUser(). Un "hiccup" de réseau simple ou périodique
  // pourrait suffire à faire échouer une requête, créant une mauvaise UX.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Routes publiques
  const publicRoutes = ['/login', '/signup', '/reset-password']
  const isPublicRoute = publicRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  )

  // Redirection si non authentifié et accès à une route protégée
  if (!user && !isPublicRoute && request.nextUrl.pathname !== '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Redirection si authentifié et accès à une route publique
  if (user && isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
