// ONE-TIME setup route to create your admin account
// IMPORTANT: DELETE THIS FILE after you create your admin user!
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { hashPassword } from '@/lib/auth'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  const username = req.nextUrl.searchParams.get('username') || 'admin'
  const email = req.nextUrl.searchParams.get('email')
  const password = req.nextUrl.searchParams.get('password')

  if (!secret || secret !== process.env.JWT_SECRET) {
    return NextResponse.json({ error: 'Invalid secret. Pass ?secret=YOUR_JWT_SECRET' }, { status: 401 })
  }
  if (!email || !password) {
    return NextResponse.json({ error: 'Pass ?email=x&password=y&secret=z' }, { status: 400 })
  }

  const { data: existing } = await supabaseAdmin
    .from('users').select('id').eq('email', email).single()
  if (existing) {
    return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
  }

  const hashed = await hashPassword(password)
  const { data, error } = await supabaseAdmin.from('users').insert({
    username, email, password: hashed, role: 'admin', is_active: true
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ 
    ok: true, 
    message: `Admin "${email}" created successfully! Now DELETE /app/api/setup/route.ts from your repo.`
  })
}
