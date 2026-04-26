'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function ImportPage() {
  const [query, setQuery] = useState('')
  const [type, setType] = useState<'movie' | 'tv'>('movie')
  const [results, setResults] = useState<any[]>([])
  const [imported, setImported] = useState<Set<number>>(new Set())
  const [importing, setImporting] = useState<number | null>(null)
  const [msg, setMsg] = useState<{ text: string; type: string } | null>(null)
  const [searching, setSearching] = useState(false)
  const [total, setTotal] = useState(0)

  const search = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setSearching(true); setResults([]); setMsg(null)
    const res = await fetch(`/api/tmdb?endpoint=/search/${type}&query=${encodeURIComponent(query)}&page=1`)
    const data = await res.json()
    setResults(data.results || [])
    setTotal(data.total_results || 0)
    setSearching(false)
  }

  const importItem = async (tmdbId: number) => {
    setImporting(tmdbId); setMsg(null)
    const res = await fetch('/api/admin', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'import_media', tmdb_id: tmdbId, media_type: type })
    })
    const data = await res.json()
    if (data.ok) {
      setImported(prev => new Set(prev).add(tmdbId))
      setMsg({ text: `✓ Imported! <a href="/admin/edit-media?id=${data.id}" style="color:#fbbf24;text-decoration:underline">Add download links →</a>`, type: 'success' })
    } else if (data.error === 'already_imported') {
      setImported(prev => new Set(prev).add(tmdbId))
      setMsg({ text: `Already imported. <a href="/admin/edit-media?id=${data.id}" style="color:#fbbf24">Edit it →</a>`, type: 'warning' })
    } else {
      setMsg({ text: data.error || 'Import failed', type: 'error' })
    }
    setImporting(null)
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ color: '#f0f0f0', fontSize: '1.2rem', fontWeight: 700, marginBottom: 4 }}>Import from TMDB</h1>
        <p style={{ color: '#555', fontSize: '.8rem' }}>Search TMDB and import movies or series</p>
      </div>

      {msg && (
        <div className={`aalert aalert-${msg.type}`} style={{ marginBottom: 16 }}
          dangerouslySetInnerHTML={{ __html: msg.text }} />
      )}

      <div className="ac" style={{ marginBottom: 20 }}>
        <div className="ac-head"><span><i className="fas fa-cloud-download-alt" style={{ color: 'var(--primary)', marginRight: 8 }} />Search &amp; Import</span></div>
        <div style={{ padding: 18 }}>
          <form onSubmit={search}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label className="afl">Search Title</label>
                <div className="asearch-wrap">
                  <i className="fas fa-search si" />
                  <input type="text" className="afc" placeholder="e.g. Avatar, Demon Slayer, Breaking Bad..."
                    value={query} onChange={e => setQuery(e.target.value)} required style={{ paddingLeft: 34 }} />
                </div>
              </div>
              <div style={{ width: 160 }}>
                <label className="afl">Type</label>
                <select className="afc" value={type} onChange={e => setType(e.target.value as any)}>
                  <option value="movie">Movie</option>
                  <option value="tv">TV / Series</option>
                </select>
              </div>
              <button type="submit" className="abtn abtn-primary" style={{ height: 38 }} disabled={searching}>
                {searching ? <><i className="fas fa-spinner fa-spin" /> Searching...</> : <><i className="fas fa-search" /> Search</>}
              </button>
            </div>
          </form>
        </div>
      </div>

      {results.length > 0 && (
        <div className="ac">
          <div className="ac-head">
            <span>Results <span style={{ fontWeight: 400, color: '#555' }}>— {total} found</span></span>
            <span style={{ fontSize: '.75rem', color: '#555' }}>{type === 'tv' ? 'TV Series' : 'Movies'}</span>
          </div>
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {results.map(item => {
              const isTV = type === 'tv'
              const title = isTV ? item.name : item.title
              const year = (isTV ? item.first_air_date : item.release_date || '').slice(0, 4)
              const poster = item.poster_path ? `https://image.tmdb.org/t/p/w92${item.poster_path}` : '/images/no-poster.jpg'
              const rating = parseFloat(item.vote_average || 0).toFixed(1)
              const overview = (item.overview || '').slice(0, 120)
              const alreadyIn = imported.has(item.id)
              return (
                <div key={item.id} className={`import-result ${alreadyIn ? 'imported' : ''}`}>
                  <img src={poster} className="ir-poster" alt="" loading="lazy" />
                  <div className="ir-info">
                    <div className="ir-title">
                      {title} {year && <span style={{ color: '#666', fontWeight: 400 }}>({year})</span>}
                    </div>
                    <div className="ir-meta">
                      {isTV && <span style={{ color: '#3b82f6', fontWeight: 600, marginRight: 8 }}>Series</span>}
                      {parseFloat(rating) > 0 && <span style={{ color: '#fbbf24', marginRight: 8 }}><i className="fas fa-star" style={{ fontSize: '.7rem' }} /> {rating}</span>}
                      {overview && <span>{overview}...</span>}
                    </div>
                  </div>
                  <div className="ir-actions">
                    {alreadyIn ? (
                      <span className="abtn" style={{ background: 'rgba(34,197,94,.1)', color: '#22c55e', borderColor: 'rgba(34,197,94,.3)' }}>
                        <i className="fas fa-check" /> Imported
                      </span>
                    ) : (
                      <button className="abtn abtn-primary" onClick={() => importItem(item.id)} disabled={importing === item.id}>
                        {importing === item.id ? <><i className="fas fa-spinner fa-spin" /> Importing...</> : <><i className="fas fa-download" /> Import</>}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {results.length === 0 && !searching && !query && (
        <div className="ac">
          <div className="ac-head"><span>How to Import</span></div>
          <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
            {[
              ['1', 'Search', 'Type a movie or series name above and select Movie or TV Series'],
              ['2', 'Import', 'Click Import next to any title to fetch all details from TMDB'],
              ['3', 'Edit', 'After import, add download links, tags, and episode video URLs'],
            ].map(([n, label, desc]) => (
              <div key={n} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 14, background: '#1a1a1a', borderRadius: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', color: '#000', fontWeight: 900, fontSize: '.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{n}</div>
                <div>
                  <div style={{ fontWeight: 700, color: '#f0f0f0', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: '.8rem', color: '#666' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
