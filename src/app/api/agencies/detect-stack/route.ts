import { NextResponse } from 'next/server'
import dns from 'dns'
import { createClient } from '@/lib/supabase/server'
import { isPrivateIp } from '@/lib/utils/ip'

const FETCH_TIMEOUT_MS = 5000
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024 // ~2 Mo
const USER_AGENT = 'ProspectCRM-StackDetector/1.0'

const STACK_MARKERS: Record<string, string[]> = {
  nextjs: ['/_next/static/', '__NEXT_DATA__', 'self.__next_f'],
  wordpress: ['wp-content', 'wp-includes'],
  webflow: ['data-wf-site', 'webflow.js'],
}

/**
 * Lit un ReadableStream en le plafonnant à `maxBytes`, pour éviter qu'une
 * page anormalement lourde bloque ou sature la mémoire du serveur.
 */
async function readBounded(body: ReadableStream<Uint8Array>, maxBytes: number): Promise<string> {
  const reader = body.getReader()
  const chunks: Uint8Array[] = []
  let received = 0

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    if (value) {
      received += value.byteLength
      chunks.push(value)
      if (received >= maxBytes) {
        await reader.cancel().catch(() => {})
        break
      }
    }
  }

  const totalLength = Math.min(received, maxBytes)
  const merged = new Uint8Array(totalLength)
  let offset = 0
  for (const chunk of chunks) {
    const remaining = totalLength - offset
    if (remaining <= 0) break
    const slice = chunk.byteLength > remaining ? chunk.subarray(0, remaining) : chunk
    merged.set(slice, offset)
    offset += slice.byteLength
  }

  return new TextDecoder('utf-8').decode(merged)
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const url = body && typeof body.url === 'string' ? body.url : null

    if (!url) {
      return NextResponse.json({ error: 'L\'URL est requise' }, { status: 400 })
    }

    // Validation de l'URL
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return NextResponse.json({ error: 'L\'URL n\'est pas valide' }, { status: 400 })
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return NextResponse.json(
        { error: 'Seuls les protocoles http et https sont autorisés' },
        { status: 400 }
      )
    }

    // Garde-fou SSRF : résoudre le hostname et rejeter les IP privées/loopback/link-local
    let addresses: string[]
    try {
      const results = await dns.promises.lookup(parsedUrl.hostname, { all: true })
      addresses = results.map((r) => r.address)
    } catch {
      return NextResponse.json({ error: 'Impossible de résoudre cette adresse' }, { status: 400 })
    }

    if (addresses.length === 0 || addresses.some((addr) => isPrivateIp(addr))) {
      return NextResponse.json(
        { error: 'Cette adresse n\'est pas autorisée' },
        { status: 403 }
      )
    }

    // Fetch borné : timeout ~5s + taille max ~2 Mo
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    let html: string
    try {
      const response = await fetch(parsedUrl.toString(), {
        signal: controller.signal,
        headers: { 'User-Agent': USER_AGENT },
        redirect: 'follow',
      })

      if (!response.ok || !response.body) {
        return NextResponse.json(
          { error: 'Impossible de récupérer la page (réponse invalide)' },
          { status: 502 }
        )
      }

      html = await readBounded(response.body, MAX_RESPONSE_BYTES)
    } catch (fetchError) {
      console.error('Detect stack fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Impossible de récupérer la page (délai dépassé ou site injoignable)' },
        { status: 502 }
      )
    } finally {
      clearTimeout(timeoutId)
    }

    const detected: string[] = []
    const evidence: Record<string, string[]> = {}

    // Next.js
    const nextjsMatches = STACK_MARKERS.nextjs?.filter((marker) => html.includes(marker)) ?? []
    if (nextjsMatches.length > 0) {
      detected.push('nextjs')
      evidence.nextjs = nextjsMatches
    }

    // React (hors Next.js) : data-reactroot, ou un <script> référençant react-dom
    const reactMatches: string[] = []
    if (html.includes('data-reactroot')) reactMatches.push('data-reactroot')
    if (/<script[^>]+src=["'][^"']*react-dom[^"']*["']/i.test(html)) {
      reactMatches.push('script src contenant react-dom')
    }
    if (reactMatches.length > 0) {
      detected.push('react')
      evidence.react = reactMatches
    }

    // WordPress
    const wpMatches = STACK_MARKERS.wordpress?.filter((marker) => html.includes(marker)) ?? []
    if (/<meta\s+name=["']generator["']\s+content=["']WordPress/i.test(html)) {
      wpMatches.push('meta generator WordPress')
    }
    if (wpMatches.length > 0) {
      detected.push('wordpress')
      evidence.wordpress = wpMatches
    }

    // Webflow
    const webflowMatches = STACK_MARKERS.webflow?.filter((marker) => html.includes(marker)) ?? []
    if (/<meta\s+name=["']generator["']\s+content=["']Webflow/i.test(html)) {
      webflowMatches.push('meta generator Webflow')
    }
    if (webflowMatches.length > 0) {
      detected.push('webflow')
      evidence.webflow = webflowMatches
    }

    return NextResponse.json({
      url: parsedUrl.toString(),
      detected,
      evidence,
      checkedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Detect stack error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
