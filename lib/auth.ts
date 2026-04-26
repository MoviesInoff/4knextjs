import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { supabaseAdmin } from './supabase'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'changeme-set-in-env-32chars-minimum'
)
const COOKIE = 'hub_session'

export type SessionUser = {
  id: string
  username: string
  email: string
  role: 'admin' | 'user'
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(SECRET)
  return token
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE)?.value
    if (!token) return null
    const { payload } = await jwtVerify(token, SECRET)
    return payload as unknown as SessionUser
  } catch {
    return null
  }
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSession()
  if (!user || user.role !== 'admin') {
    throw new Error('Unauthorized')
  }
  return user
}

export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs')
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs')
  return bcrypt.compare(password, hash)
}

export async function getUserByEmail(email: string) {
  const { data } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email)
    .eq('is_active', true)
    .single()
  return data
}

export { COOKIE }
