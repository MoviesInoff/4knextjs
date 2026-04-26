'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await fetch('/api/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await res.json()
    if (data.ok) { router.push('/'); router.refresh() }
    else { setError(data.error || 'Registration failed'); setLoading(false) }
  }

  return (
    <div style={{ paddingTop: 'var(--header-h)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: 1, marginBottom: 8 }}>Create Account</h1>
          <p style={{ color: 'var(--text3)', fontSize: '.9rem' }}>Join free and start watching</p>
        </div>
        <div className="ac">
          <div style={{ padding: 24 }}>
            {error && <div className="aalert aalert-error" style={{ marginBottom: 16 }}><i className="fas fa-exclamation-circle" /> {error}</div>}
            <form onSubmit={submit}>
              {(['username', 'email', 'password'] as const).map(field => (
                <div className="form-group" key={field}>
                  <label className="form-label">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                  <input className="form-control" type={field === 'email' ? 'email' : field === 'password' ? 'password' : 'text'}
                    value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })}
                    placeholder={field === 'username' ? 'cooluser123' : field === 'email' ? 'your@email.com' : '••••••••'}
                    required minLength={field === 'password' ? 6 : 1} />
                </div>
              ))}
              <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: 8 }}>
                {loading ? <><i className="fas fa-spinner fa-spin" /> Creating...</> : <><i className="fas fa-user-plus" /> Register Free</>}
              </button>
            </form>
            <p style={{ textAlign: 'center', marginTop: 16, fontSize: '.85rem', color: 'var(--text3)' }}>
              Already have an account? <Link href="/login" style={{ color: 'var(--primary)' }}>Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
