import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching payments:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des paiements' },
        { status: 500 }
      )
    }

    return NextResponse.json({ payments: payments || [] })
  } catch (error) {
    console.error('Error in export payments:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
