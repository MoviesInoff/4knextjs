'use client'
import { useState, useEffect } from 'react'

export default function SettingsPage() {
  const [form, setForm] = useState<Record<string, string>>({})
  const [loaded, setLoaded] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/admin-data?resource=settings').then(r => r.json()).then(d => { setForm(d.data || {}); setLoaded(true) })
  }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'save_settings', settings: form }) })
    setSaved(true); setSaving(false); setTimeout(() => setSaved(false), 3000)
  }

  const f = (key: string) => ({ className: 'afc', value: form[key] || '', onChange: (e: any) => setForm(p => ({ ...p, [key]: e.target.value })) })

  if (!loaded) return <div style={{ color: '#555', padding: 40, textAlign: 'center' }}><i className="fas fa-spinner fa-spin" /> Loading...</div>

  return (
    <div style={{ maxWidth: 700 }}>
      <h1 style={{ color: '#f0f0f0', fontSize: '1.2rem', fontWeight: 700, marginBottom: 20 }}>Site Settings</h1>
      {saved && <div className="aalert aalert-success" style={{ marginBottom: 16 }}><i className="fas fa-check-circle" /> Settings saved!</div>}

      <form onSubmit={save}>
        <div className="ac" style={{ marginBottom: 18 }}>
          <div className="ac-head"><span>General</span></div>
          <div style={{ padding: 18 }}>
            <div className="afr">
              <div className="afg"><label className="afl">Site Name</label><input {...f('site_name')} required /></div>
              <div className="afg"><label className="afl">Tagline</label><input {...f('site_tagline')} /></div>
            </div>
          </div>
        </div>

        <div className="ac" style={{ marginBottom: 18 }}>
          <div className="ac-head"><span>Primary Accent Color</span></div>
          <div style={{ padding: 18 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input type="color" value={form.primary_color || '#f97316'}
                onChange={e => setForm(p => ({ ...p, primary_color: e.target.value }))}
                style={{ width: 44, height: 40, borderRadius: 8, border: '1px solid rgba(255,255,255,.1)', cursor: 'pointer', padding: 3 }} />
              <input className="afc" value={form.primary_color || '#f97316'}
                onChange={e => { if (/^#[0-9a-f]{6}$/i.test(e.target.value)) setForm(p => ({ ...p, primary_color: e.target.value })) }}
                style={{ maxWidth: 130, fontFamily: 'monospace' }} />
            </div>
          </div>
        </div>

        <div className="ac" style={{ marginBottom: 18 }}>
          <div className="ac-head"><span>Social Links</span></div>
          <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { key: 'social_telegram', icon: 'telegram', color: '#229ED9', label: 'Telegram URL', ph: 'https://t.me/yourchannel' },
              { key: 'social_twitter', icon: 'x-twitter', color: '#fff', label: 'X / Twitter URL', ph: 'https://x.com/yourhandle' },
              { key: 'social_instagram', icon: 'instagram', color: '#e1306c', label: 'Instagram URL', ph: 'https://instagram.com/yourpage' },
              { key: 'social_youtube', icon: 'youtube', color: '#FF0000', label: 'YouTube URL', ph: 'https://youtube.com/@yourchannel' },
              { key: 'social_facebook', icon: 'facebook-f', color: '#1877F2', label: 'Facebook URL', ph: 'https://facebook.com/yourpage' },
            ].map(s => (
              <div key={s.key} className="afg">
                <label className="afl"><i className={`fab fa-${s.icon}`} style={{ color: s.color, marginRight: 6 }} />{s.label}</label>
                <input type="url" {...f(s.key)} placeholder={s.ph} />
              </div>
            ))}
          </div>
        </div>

        <div className="ac" style={{ marginBottom: 18 }}>
          <div className="ac-head"><span>Content Display</span></div>
          <div style={{ padding: 18 }}>
            <div className="afr">
              <div className="afg">
                <label className="afl">Homepage Items Per Page</label>
                <input type="number" {...f('homepage_count')} min="8" max="40" step="4" />
                <div className="afh">Latest Releases on homepage (8–40)</div>
              </div>
              <div className="afg">
                <label className="afl">Browse Pages Items Per Page</label>
                <input type="number" {...f('items_per_page')} min="8" max="40" step="4" />
                <div className="afh">Movies / Series / Anime pages (8–40)</div>
              </div>
            </div>
          </div>
        </div>

        <div className="ac" style={{ marginBottom: 18 }}>
          <div className="ac-head"><span>Access Control</span></div>
          <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { key: 'show_hero_slider', label: 'Homepage Hero Slider', desc: 'Turn ON/OFF the trending hero slider' },
              { key: 'allow_registration', label: 'User Registration', desc: 'When OFF — Sign In & Register buttons are hidden' },
              { key: 'maintenance_mode', label: 'Maintenance Mode', desc: 'Show maintenance page to regular visitors' },
            ].map(item => (
              <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14, background: '#1a1a1a', borderRadius: 9 }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#f0f0f0', marginBottom: 3 }}>{item.label}</div>
                  <div style={{ fontSize: '.78rem', color: '#555' }}>{item.desc}</div>
                </div>
                <label className="toggle">
                  <input type="checkbox" checked={form[item.key] === '1'} onChange={e => setForm(p => ({ ...p, [item.key]: e.target.checked ? '1' : '0' }))} />
                  <span className="toggle-sl" />
                </label>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" className="abtn abtn-primary" disabled={saving}>
          {saving ? <><i className="fas fa-spinner fa-spin" /> Saving...</> : <><i className="fas fa-save" /> Save Settings</>}
        </button>
      </form>
    </div>
  )
}
