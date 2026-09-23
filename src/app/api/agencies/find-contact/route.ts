import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractDomain } from '@/lib/validations/agency'

const HUNTER_DOMAIN_SEARCH_URL = 'https://api.hunter.io/v2/domain-search'

// Mots-clés indiquant un profil décisionnaire technique (CTO / Tech Lead),
// utilisés pour classer les résultats Hunter par pertinence plutôt que de
// se fier à leurs filtres `department`/`seniority` (peu fiables sur ce cas
// précis : "engineering" n'est pas un département reconnu par leur API).
//
// Comparés avec une limite de mot (\b) et non un simple `includes()` : un
// sigle court comme "cto" apparaît sinon par accident DANS des mots courants
// ("dire-CTO-r" contient littéralement la sous-chaîne "cto"), ce qui faisait
// remonter à tort n'importe quel "Director of ...".
const TECH_LEAD_KEYWORDS = [
  'cto',
  'chief technology officer',
  'chief technical officer',
  'chief information officer',
  'tech lead',
  'technical lead',
  'vp engineering',
  'vp of engineering',
  'head of engineering',
  'head of technology',
  'engineering manager',
  'lead developer',
  'lead engineer',
  'directeur technique',
  'responsable technique',
]

const TECH_LEAD_PATTERNS = TECH_LEAD_KEYWORDS.map(
  (keyword) => new RegExp(`\\b${keyword.replace(/\s+/g, '\\s+')}\\b`, 'i')
)

type HunterEmail = {
  value: string
  first_name: string | null
  last_name: string | null
  position: string | null
  seniority: 'junior' | 'senior' | 'executive' | null
  department: string | null
  decision_maker: boolean | null
  linkedin: string | null
  confidence: number | null
}

type Candidate = {
  name: string | null
  position: string | null
  email: string
  linkedinUrl: string | null
  confidence: number | null
  seniority: string | null
  isTechLead: boolean
}

/**
 * Le badge "Tech lead" ne doit refléter que le titre du poste lui-même :
 * `department`/`seniority`/`decision_maker` de Hunter sont des classifications
 * généralistes peu fiables pour cibler spécifiquement un profil technique
 * (elles marquent aussi bien un "Director of Partnerships" que ce qu'on
 * cherche). On les garde uniquement comme départage de tri, jamais comme
 * déclencheur du badge.
 */
function isTechLeadTitle(email: HunterEmail): boolean {
  const position = email.position || ''
  return TECH_LEAD_PATTERNS.some((pattern) => pattern.test(position))
}

function sortScore(email: HunterEmail, titleMatch: boolean): number {
  let score = titleMatch ? 10 : 0

  if (email.department === 'it' && email.seniority === 'executive') {
    score += 2
  }
  if (email.decision_maker) {
    score += 1
  }

  return score
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

    const apiKey = process.env.HUNTER_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'La clé API Hunter.io n\'est pas configurée sur le serveur' },
        { status: 500 }
      )
    }

    const body = await request.json().catch(() => null)
    const website = body && typeof body.website === 'string' ? body.website : null

    if (!website) {
      return NextResponse.json({ error: 'Le site web est requis' }, { status: 400 })
    }

    const domain = extractDomain(website)
    if (!domain) {
      return NextResponse.json({ error: 'Impossible d\'extraire un nom de domaine de cette URL' }, { status: 400 })
    }

    const searchUrl = `${HUNTER_DOMAIN_SEARCH_URL}?domain=${encodeURIComponent(domain)}&limit=10`

    const response = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json(
          { error: 'Clé API Hunter.io invalide ou quota dépassé' },
          { status: response.status }
        )
      }
      if (response.status === 429) {
        return NextResponse.json(
          { error: 'Trop de requêtes envoyées à Hunter.io, réessayez dans un instant' },
          { status: 429 }
        )
      }
      return NextResponse.json(
        { error: 'Impossible d\'interroger Hunter.io pour le moment' },
        { status: 502 }
      )
    }

    const json = await response.json()
    const emails: HunterEmail[] = json?.data?.emails || []

    const ranked = emails
      .filter((email) => !!email.value)
      .map((email) => {
        const titleMatch = isTechLeadTitle(email)
        const candidate: Candidate = {
          name: [email.first_name, email.last_name].filter(Boolean).join(' ') || null,
          position: email.position,
          email: email.value,
          linkedinUrl: email.linkedin,
          confidence: email.confidence,
          seniority: email.seniority,
          isTechLead: titleMatch,
        }
        return { candidate, score: sortScore(email, titleMatch) }
      })
      .sort((a, b) => b.score - a.score)

    const candidates: Candidate[] = ranked.map((r) => r.candidate)

    return NextResponse.json({
      domain,
      organization: json?.data?.organization || null,
      candidates,
      totalFound: emails.length,
    })
  } catch (error) {
    console.error('Find contact error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
