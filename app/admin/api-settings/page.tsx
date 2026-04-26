'use client'
import { useState, useEffect } from 'react'

export default function APISettingsPage() {
  const [key, setKey] = useState('')
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null)

  useEffect(() => {
    fetch('/api/admin-data?resource=settings').then(r => r.json()).then(d => setKey(d.data?.tmdb_api_key || ''))
  }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'save_settings', settings: { tmdb_api_key: key.trim() } }) })
    setSaved(true); setTimeout(() => setSaved(false), 3000)
  }

  const test = async () => {
    setTesting(true); setTestResult(null)
    const res = await fetch(`/api/tmdb?endpoint=/movie/popular&page=1`)
    const data = await res.json()
    if (data.results?.length > 0) setTestResult({ ok: true, msg: `Connected! Found ${data.total_results} movies.` })
    else setTestResult({ ok: false, msg: 'Connection failed. Check your API key.' })
    setTesting(false)
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <h1 style={{ color: '#f0f0f0', fontSize: '1.2rem', fontWeight: 700, marginBottom: 20 }}>API Settings</h1>

      {saved && <div className="aalert aalert-success" style={{ marginBottom: 16 }}><i className="fas fa-check-circle" /> API key saved!</div>}
      {testResult && (
        <div className={`aalert aalert-${testResult.ok ? 'success' : 'error'}`} style={{ marginBottom: 16 }}>
          <i className={`fas fa-${testResult.ok ? 'check-circle' : 'times-circle'}`} /> {testResult.msg}
        </div>
      )}

      <div className="ac">
        <div className="ac-head"><span>TMDB API Key</span></div>
        <div style={{ padding: 18 }}>
          <form onSubmit={save}>
            <div className="afg">
              <label className="afl">API Key (v3 auth)</label>
              <input type="password" className="afc" value={key} onChange={e => setKey(e.target.value)} placeholder="Enter your TMDB API key" />
              <div className="afh">
                Get your free API key at <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener" style={{ color: 'var(--primary)' }}>themoviedb.org/settings/api</a>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="abtn abtn-primary"><i className="fas fa-save" /> Save Key</button>
              <button type="button" className="abtn" onClick={test} disabled={testing || !key}>
                {testing ? <><i className="fas fa-spinner fa-spin" /> Testing...</> : <><i className="fas fa-plug" /> Test Connection</>}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="ac" style={{ marginTop: 16 }}>
        <div className="ac-head"><span>How It Works (Jio Fix)</span></div>
        <div style={{ padding: 18 }}>
          <p style={{ fontSize: '.85rem', color: '#888', lineHeight: 1.7 }}>
            All TMDB API calls are routed through <strong style={{ color: '#f0f0f0' }}>Cloudflare Edge Workers</strong>, not the user&apos;s browser. This means Jio network blocks on TMDB are completely bypassed — the request goes from Cloudflare&apos;s servers, not the user&apos;s IP.
          </p>
          <div style={{ marginTop: 12, padding: '10px 14px', background: '#1a1a1a', borderRadius: 8, borderLeft: '3px solid #22c55e' }}>
            <div style={{ fontSize: '.78rem', color: '#22c55e', fontWeight: 700, marginBottom: 4 }}>✓ Jio-Proof Architecture</div>
            <div style={{ fontSize: '.75rem', color: '#666' }}>User → Cloudflare Pages → CF Worker → TMDB API → back to user</div>
          </div>
        </div>
      </div>
    </div>
  )
}
