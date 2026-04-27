import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { media_id, action } = await req.json()
  if (!media_id) return NextResponse.json({ error: 'No media_id' }, { status: 400 })

  if (action === 'remove') {
    await supabaseAdmin.from('watchlist').delete()
      .eq('user_id', user.id).eq('media_id', media_id)
    return NextResponse.json({ ok: true, action: 'removed' })
  }

  await supabaseAdmin.from('watchlist').upsert(
    { user_id: user.id, media_id },
    { onConflict: 'user_id,media_id' }
  )
  return NextResponse.json({ ok: true, action: 'added' })
}

export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ items: [] })

  const { data } = await supabaseAdmin
    .from('watchlist')
    .select('media_id, added_at, media(id, tmdb_id, type, title, poster_path, year, vote_average, tags)')
    .eq('user_id', user.id)
    .order('added_at', { ascending: false })

  return NextResponse.json({ items: data || [] })
}
