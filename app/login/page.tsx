'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const data = await res.json()
    if (data.ok) { router.push('/'); router.refresh() }
    else { setError(data.error || 'Login failed'); setLoading(false) }
  }

  return (
    <div style={{ paddingTop: 'var(--header-h)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: 1, marginBottom: 8 }}>Welcome Back</h1>
          <p style={{ color: 'var(--text3)', fontSize: '.9rem' }}>Sign in to your account</p>
        </div>
        <div className="ac">
          <div style={{ padding: 24 }}>
            {error && <div className="aalert aalert-error" style={{ marginBottom: 16 }}><i className="fas fa-exclamation-circle" /> {error}</div>}
            <form onSubmit={submit}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-control" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-control" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: 8 }}>
                {loading ? <><i className="fas fa-spinner fa-spin" /> Signing In...</> : <><i className="fas fa-sign-in-alt" /> Sign In</>}
              </button>
            </form>
            <p style={{ textAlign: 'center', marginTop: 16, fontSize: '.85rem', color: 'var(--text3)' }}>
              Don&apos;t have an account? <Link href="/register" style={{ color: 'var(--primary)' }}>Register Free</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
