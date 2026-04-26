import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getAllSettings } from '@/lib/settings'

export async function GET(req: NextRequest) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const resource = req.nextUrl.searchParams.get('resource')

  if (resource === 'embed_servers') {
    const { data } = await supabaseAdmin.from('embed_servers').select('*').order('sort_order').order('id')
    return NextResponse.json({ data })
  }

  if (resource === 'settings') {
    const settings = await getAllSettings()
    return NextResponse.json({ data: settings })
  }

  if (resource === 'users') {
    const { data } = await supabaseAdmin.from('users').select('id, username, email, role, is_active, created_at').order('created_at', { ascending: false })
    return NextResponse.json({ data })
  }

  return NextResponse.json({ error: 'Unknown resource' }, { status: 400 })
}
