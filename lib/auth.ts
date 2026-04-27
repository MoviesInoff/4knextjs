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
  if (!user || user.role !== 'admin') throw new Error('Unauthorized')
  return user
}

// Edge-compatible password hashing using Web Crypto API
async function getKeyMaterial(password: string): Promise<CryptoKey> {
  const enc = new TextEncoder()
  return crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits', 'deriveKey'])
}

async function deriveKey(keyMaterial: CryptoKey, salt: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'HMAC', hash: 'SHA-256', length: 256 },
    true,
    ['sign', 'verify']
  )
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const keyMaterial = await getKeyMaterial(password)
  const key = await deriveKey(keyMaterial, salt)
  const exported = await crypto.subtle.exportKey('raw', key)
  const hashArray = new Uint8Array(exported)
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('')
  const hashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('')
  return `pbkdf2:${saltHex}:${hashHex}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    // Support old bcrypt hashes during migration (starts with $2b$)
    if (stored.startsWith('$2')) {
      // Can't verify bcrypt on edge - return false, user needs to reset
      return false
    }
    const [, saltHex, storedHashHex] = stored.split(':')
    const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(b => parseInt(b, 16)))
    const keyMaterial = await getKeyMaterial(password)
    const key = await deriveKey(keyMaterial, salt)
    const exported = await crypto.subtle.exportKey('raw', key)
    const hashArray = new Uint8Array(exported)
    const hashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('')
    return hashHex === storedHashHex
  } catch {
    return false
  }
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
