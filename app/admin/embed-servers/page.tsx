'use client'
import { useState, useEffect } from 'react'

export default function EmbedServersPage() {
  const [servers, setServers] = useState<any[]>([])
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState({ name: '', movie_url: '', tv_url: '', is_active: true, sort_order: 0, use_imdb_id: false })
  const [msg, setMsg] = useState<{ text: string, type: string } | null>(null)

  useEffect(() => { fetchServers() }, [])

  const fetchServers = async () => {
    const res = await fetch('/api/tmdb?endpoint=/configuration') // dummy; we fetch from supabase directly
    // Actually fetch from our admin API
    const r = await fetch('/api/admin-data?resource=embed_servers')
    const d = await r.json()
    setServers(d.data || [])
  }

  const save = async () => {
    const action = editing ? 'edit_server' : 'add_server'
    const res = await fetch('/api/admin', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...(editing ? { id: editing.id } : {}), ...form })
    })
    const data = await res.json()
    if (data.ok) { setMsg({ text: editing ? 'Updated!' : 'Added!', type: 'success' }); setEditing(null); setForm({ name: '', movie_url: '', tv_url: '', is_active: true, sort_order: 0, use_imdb_id: false }); fetchServers() }
  }

  const toggle = async (id: number) => {
    await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'toggle_server', id }) })
    fetchServers()
  }

  const del = async (id: number) => {
    if (!confirm('Delete server?')) return
    await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete_server', id }) })
    fetchServers()
  }

  const startEdit = (s: any) => { setEditing(s); setForm({ name: s.name, movie_url: s.movie_url || '', tv_url: s.tv_url || '', is_active: s.is_active, sort_order: s.sort_order, use_imdb_id: s.use_imdb_id }) }

  return (
    <div>
      <h1 style={{ color: '#f0f0f0', fontSize: '1.2rem', fontWeight: 700, marginBottom: 20 }}>Embed Servers</h1>
      {msg && <div className={`aalert aalert-${msg.type}`} style={{ marginBottom: 16 }}><i className="fas fa-check-circle" /> {msg.text}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
        {/* Server list */}
        <div className="ac">
          <div className="ac-head"><span>Servers ({servers.length})</span></div>
          {servers.length === 0 ? <div style={{ padding: 30, textAlign: 'center', color: '#555' }}>No servers yet.</div> : (
            <div style={{ overflowX: 'auto' }}>
              <table className="atable">
                <thead><tr><th>Name</th><th>ID Mode</th><th>Status</th><th>Order</th><th></th></tr></thead>
                <tbody>
                  {servers.map(s => (
                    <tr key={s.id}>
                      <td>
                        <strong style={{ color: '#f0f0f0' }}>{s.name}</strong>
                        <div style={{ fontSize: '.72rem', color: '#444', marginTop: 2 }}>{(s.movie_url || '').slice(0, 40)}...</div>
                      </td>
                      <td><span style={{ background: s.use_imdb_id ? 'rgba(251,191,36,.15)' : 'rgba(99,102,241,.15)', color: s.use_imdb_id ? '#fbbf24' : '#818cf8', padding: '2px 8px', borderRadius: 4, fontSize: '.7rem', fontWeight: 700 }}>{s.use_imdb_id ? 'IMDb' : 'TMDB'}</span></td>
                      <td><span style={{ background: s.is_active ? 'rgba(34,197,94,.12)' : 'rgba(107,114,128,.12)', color: s.is_active ? '#22c55e' : '#9ca3af', padding: '2px 8px', borderRadius: 4, fontSize: '.7rem', fontWeight: 700 }}>{s.is_active ? 'Active' : 'Off'}</span></td>
                      <td style={{ color: '#888' }}>{s.sort_order}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button className="abtn abtn-sm" onClick={() => startEdit(s)}><i className="fas fa-edit" /></button>
                          <button className="abtn abtn-sm" onClick={() => toggle(s.id)}><i className="fas fa-power-off" /></button>
                          <button className="abtn abtn-danger abtn-sm" onClick={() => del(s.id)}><i className="fas fa-trash" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add/Edit form */}
        <div className="ac">
          <div className="ac-head">
            <span>{editing ? 'Edit Server' : 'Add Server'}</span>
            {editing && <button className="abtn abtn-sm" onClick={() => { setEditing(null); setForm({ name: '', movie_url: '', tv_url: '', is_active: true, sort_order: 0, use_imdb_id: false }) }}>Cancel</button>}
          </div>
          <div style={{ padding: 18 }}>
            <div className="afg"><label className="afl">Server Name *</label><input className="afc" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. VidSrc" /></div>
            <div className="afg" style={{ background: '#1a1a1a', borderRadius: 8, padding: 12, border: '1px solid rgba(255,255,255,.07)' }}>
              <label className="afl" style={{ marginBottom: 8, display: 'block' }}>ID Type Used by This Server</label>
              <div style={{ display: 'flex', gap: 16 }}>
                {[{ val: false, label: 'TMDB ID', code: '{tmdb_id}' }, { val: true, label: 'IMDb ID', code: '{imdb_id}' }].map(opt => (
                  <label key={String(opt.val)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '.875rem', color: '#888' }}>
                    <input type="radio" checked={form.use_imdb_id === opt.val} onChange={() => setForm(p => ({ ...p, use_imdb_id: opt.val }))} style={{ accentColor: 'var(--primary)' }} />
                    <span><strong style={{ color: '#f0f0f0' }}>{opt.label}</strong> — use <code style={{ color: 'var(--primary)' }}>{opt.code}</code></span>
                  </label>
                ))}
              </div>
            </div>
            <div className="afg">
              <label className="afl">Movie Embed URL</label>
              <input className="afc" value={form.movie_url} onChange={e => setForm(p => ({ ...p, movie_url: e.target.value }))} placeholder="https://vidsrc.to/embed/movie/{tmdb_id}" />
            </div>
            <div className="afg">
              <label className="afl">TV Show Embed URL</label>
              <input className="afc" value={form.tv_url} onChange={e => setForm(p => ({ ...p, tv_url: e.target.value }))} placeholder="https://vidsrc.to/embed/tv/{tmdb_id}/{season}/{episode}" />
              <div className="afh">Placeholders: <code style={{ color: 'var(--primary)' }}>{'{tmdb_id}'}</code> <code style={{ color: 'var(--primary)' }}>{'{imdb_id}'}</code> <code style={{ color: 'var(--primary)' }}>{'{season}'}</code> <code style={{ color: 'var(--primary)' }}>{'{episode}'}</code></div>
            </div>
            <div className="afg"><label className="afl">Sort Order</label><input type="number" className="afc" value={form.sort_order} onChange={e => setForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} style={{ maxWidth: 100 }} /></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <label className="toggle"><input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} /><span className="toggle-sl" /></label>
              <span style={{ fontSize: '.875rem', color: '#888' }}>Active</span>
            </div>
            <button className="abtn abtn-primary" onClick={save}><i className="fas fa-save" /> {editing ? 'Update' : 'Add Server'}</button>

            <div style={{ marginTop: 16, padding: 12, background: '#1a1a1a', borderRadius: 8, borderLeft: '3px solid #3b82f6' }}>
              <div style={{ fontSize: '.78rem', color: '#555' }}>
                <strong style={{ color: '#3b82f6' }}>Free embed sources:</strong><br />
                TMDB: <code style={{ color: 'var(--primary)', fontSize: '.72rem' }}>vidsrc.to/embed/movie/{'{tmdb_id}'}</code><br />
                TMDB TV: <code style={{ color: 'var(--primary)', fontSize: '.72rem' }}>vidsrc.to/embed/tv/{'{tmdb_id}'}/{'{season}'}/{'{episode}'}</code><br />
                IMDb: <code style={{ color: 'var(--primary)', fontSize: '.72rem' }}>www.2embed.cc/embed/{'{imdb_id}'}</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
