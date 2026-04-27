import { NextRequest, NextResponse } from 'next/server'
import { hashPassword, createSession, COOKIE } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getSetting } from '@/lib/settings'

export async function POST(req: NextRequest) {
  try {
    const allowReg = await getSetting('allow_registration', '1')
    if (allowReg !== '1') {
      return NextResponse.json({ error: 'Registration is disabled' }, { status: 403 })
    }

    const { username, email, password } = await req.json()
    if (!username || !email || !password) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const { data: existing } = await supabaseAdmin
      .from('users').select('id').eq('email', email).single()
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
    }

    const hashed = await hashPassword(password)
    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert({ username, email, password: hashed, role: 'user' })
      .select().single()

    if (error || !newUser) {
      return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
    }

    const session = { id: newUser.id, username: newUser.username, email: newUser.email, role: newUser.role }
    const token = await createSession(session)
    const res = NextResponse.json({ ok: true, user: session })
    res.cookies.set(COOKIE, token, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 86400 * 7, path: '/' })
    return res
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
