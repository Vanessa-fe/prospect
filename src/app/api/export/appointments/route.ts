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

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('user_id', user.id)
      .order('start_at', { ascending: false })

    if (error) {
      console.error('Error fetching appointments:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des rendez-vous' },
        { status: 500 }
      )
    }

    return NextResponse.json({ appointments: appointments || [] })
  } catch (error) {
    console.error('Error in export appointments:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
