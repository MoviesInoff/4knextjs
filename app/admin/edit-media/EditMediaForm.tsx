'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { tmdbImg } from '@/lib/tmdb'

export default function EditMediaForm({ media, downloads, episodeVideos, seasonsData, poster, tagsStr }: any) {
  const router = useRouter()
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    title: media.title || '', tagline: media.tagline || '', overview: media.overview || '',
    year: media.year || '', runtime: media.runtime || '', vote_average: media.vote_average || '',
    director: media.director || '', audio_languages: media.audio_languages || '',
    status: media.status || 'published', featured: !!media.featured,
    imdb_id: media.imdb_id || '', tags: tagsStr, custom_video_url: media.custom_video_url || '',
  })
  const [dlList, setDlList] = useState<any[]>(downloads)
  const [evMap, setEvMap] = useState<Record<string, any>>(episodeVideos)
  const [activeSeason, setActiveSeason] = useState<number>(seasonsData[0]?.season_number || 1)
  const [seasonEps, setSeasonEps] = useState<any[]>([])
  const [loadingEps, setLoadingEps] = useState(false)
  const [expandedDl, setExpandedDl] = useState<number | null>(null)
  const [expandedEp, setExpandedEp] = useState<string | null>(null)
  const [addDlOpen, setAddDlOpen] = useState(false)
  const [newDl, setNewDl] = useState({ title: '', quality: '', format: '', codec: '', hdr: '', file_size: '', audio: '', url: '', sort_order: 0, season_num: '', episode_num: '' })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    await fetch('/api/admin', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save_media', id: media.id, ...form })
    })
    setSaved(true); setSaving(false)
    setTimeout(() => setSaved(false), 3000)
  }

  const loadSeasonEps = async (sn: number) => {
    setActiveSeason(sn); setLoadingEps(true); setSeasonEps([])
    const res = await fetch(`/api/tmdb?endpoint=/tv/${media.tmdb_id}/season/${sn}`)
    const data = await res.json()
    setSeasonEps(data.episodes || [])
    setLoadingEps(false)
  }

  const saveEpVideo = async (sn: number, en: number, url: string) => {
    await fetch('/api/admin', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save_episode_video', media_id: media.id, season_num: sn, episode_num: en, video_url: url })
    })
    setEvMap(prev => {
      const next = { ...prev }
      if (url) next[`${sn}-${en}`] = { season_num: sn, episode_num: en, video_url: url }
      else delete next[`${sn}-${en}`]
      return next
    })
    setExpandedEp(null)
  }

  const addDownload = async () => {
    if (!newDl.title) return
    const res = await fetch('/api/admin', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_download', media_id: media.id, ...newDl, season_num: newDl.season_num || null, episode_num: newDl.episode_num || null })
    })
    const data = await res.json()
    if (data.ok) {
      setDlList(prev => [...prev, { id: data.id, ...newDl }])
      setNewDl({ title: '', quality: '', format: '', codec: '', hdr: '', file_size: '', audio: '', url: '', sort_order: 0, season_num: '', episode_num: '' })
      setAddDlOpen(false)
    }
  }

  const deleteDownload = async (id: number) => {
    if (!confirm('Delete this link?')) return
    await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete_download', id }) })
    setDlList(prev => prev.filter(d => d.id !== id))
  }

  const deleteMedia = async () => {
    if (!confirm(`Delete "${media.title}" permanently?`)) return
    await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete_media', id: media.id }) })
    router.push('/admin/media-list')
  }

  const inp = (field: keyof typeof form) => ({
    className: 'afc', value: (form as any)[field],
    onChange: (e: any) => setForm(prev => ({ ...prev, [field]: e.target.value }))
  })

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ color: '#f0f0f0', fontSize: '1.2rem', fontWeight: 700 }}>Edit Media</h1>
          <p style={{ color: '#555', fontSize: '.8rem' }}>Edit details, tags and download links</p>
        </div>
        <Link href="/admin/media-list" className="abtn abtn-sm"><i className="fas fa-arrow-left" /> Back</Link>
      </div>

      {saved && <div className="aalert aalert-success" style={{ marginBottom: 16 }}><i className="fas fa-check-circle" /> Saved successfully!</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 20, alignItems: 'start', marginBottom: 20 }}>
        <div>
          <img src={poster} style={{ width: '100%', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,.5)' }} alt="" />
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Link href={media.type === 'tv' ? `/series?id=${media.tmdb_id}` : `/movie?id=${media.tmdb_id}`} target="_blank" className="abtn abtn-sm abtn-full">
              <i className="fas fa-eye" /> View Page
            </Link>
            <button className="abtn abtn-danger abtn-sm abtn-full" onClick={deleteMedia}>
              <i className="fas fa-trash" /> Delete
            </button>
          </div>
        </div>

        <div className="ac">
          <div className="ac-head">
            <span><i className="fas fa-info-circle" style={{ color: 'var(--primary)', marginRight: 8 }} />Media Details</span>
            <span style={{ fontSize: '.75rem', color: '#555' }}>TMDB ID: {media.tmdb_id} · {media.type === 'tv' ? 'SERIES' : 'MOVIE'}</span>
          </div>
          <div style={{ padding: 18 }}>
            <div className="afr">
              <div className="afg"><label className="afl">Title *</label><input {...inp('title')} /></div>
              <div className="afg"><label className="afl">Year</label><input {...inp('year')} maxLength={4} /></div>
            </div>
            <div className="afg"><label className="afl">Tagline</label><input {...inp('tagline')} /></div>
            <div className="afg"><label className="afl">Overview</label><textarea className="afc" rows={4} value={form.overview} onChange={e => setForm(p => ({ ...p, overview: e.target.value }))} /></div>
            <div className="afr">
              <div className="afg"><label className="afl">Rating (0-10)</label><input type="number" {...inp('vote_average')} step="0.1" min="0" max="10" /></div>
              <div className="afg"><label className="afl">Runtime (minutes)</label><input type="number" {...inp('runtime')} /></div>
            </div>
            <div className="afr">
              <div className="afg"><label className="afl">Director</label><input {...inp('director')} /></div>
              <div className="afg"><label className="afl">IMDb ID</label><input {...inp('imdb_id')} placeholder="tt1234567" /></div>
            </div>
            <div className="afg">
              <label className="afl">Audio Languages</label>
              <input {...inp('audio_languages')} placeholder="Hindi | Tamil | Telugu | English" />
            </div>
            <div className="afg">
              <label className="afl">Tags <span style={{ color: '#555', textTransform: 'none', letterSpacing: 0 }}>(comma separated)</span></label>
              <input {...inp('tags')} placeholder="4K, HDR, DV, 1080p, WEB-DL, Blu-Ray" />
              <div className="afh">Show as colored badges on cards. Examples: 4K, HDR, DV, 1080p, WEB-DL, BluRay</div>
            </div>
            <div className="afg">
              <label className="afl">Custom Video URL <span style={{ color: '#555', textTransform: 'none', letterSpacing: 0 }}>(optional — movies only)</span></label>
              <input type="url" {...inp('custom_video_url')} placeholder="https://vhost.com/your-video-id" />
              <div className="afh">If set, used as the Alpha server. For TV series, set per-episode below.</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <div className="afg" style={{ flex: 1 }}>
                <label className="afl">Status</label>
                <select className="afc" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 20 }}>
                <label className="toggle">
                  <input type="checkbox" checked={form.featured} onChange={e => setForm(p => ({ ...p, featured: e.target.checked }))} />
                  <span className="toggle-sl" />
                </label>
                <span style={{ fontSize: '.875rem', color: '#888' }}>Featured (hero)</span>
              </div>
            </div>
            <button className="abtn abtn-primary" onClick={save} disabled={saving}>
              {saving ? <><i className="fas fa-spinner fa-spin" /> Saving...</> : <><i className="fas fa-save" /> Save Changes</>}
            </button>
          </div>
        </div>
      </div>

      {/* Download Links */}
      <div className="ac" style={{ marginBottom: 20 }}>
        <div className="ac-head">
          <span><i className="fas fa-download" style={{ color: 'var(--primary)', marginRight: 8 }} />Download Links ({dlList.length})</span>
          <button className="abtn abtn-sm" onClick={() => setAddDlOpen(!addDlOpen)}><i className="fas fa-plus" /> Add</button>
        </div>
        <div style={{ padding: 18 }}>
          {dlList.map(dl => (
            <div key={dl.id} style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,.07)', borderRadius: 10, padding: '14px 16px', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#f0f0f0', marginBottom: 6 }}>{dl.title}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {dl.season_num && <span style={{ background: '#333', color: '#888', padding: '2px 7px', borderRadius: 4, fontSize: '.7rem', fontWeight: 700 }}>S{dl.season_num}{dl.episode_num ? ` E${dl.episode_num}` : ''}</span>}
                    {dl.file_size && <span style={{ background: 'var(--primary)', color: '#000', padding: '2px 7px', borderRadius: 4, fontSize: '.7rem', fontWeight: 700 }}>{dl.file_size}</span>}
                    {dl.quality && <span style={{ background: 'rgba(59,130,246,.15)', color: '#3b82f6', padding: '2px 7px', borderRadius: 4, fontSize: '.7rem', fontWeight: 700 }}>{dl.quality}</span>}
                    {dl.hdr && <span style={{ background: 'rgba(168,85,247,.15)', color: '#a855f7', padding: '2px 7px', borderRadius: 4, fontSize: '.7rem', fontWeight: 700 }}>{dl.hdr}</span>}
                    {dl.format && <span style={{ background: 'rgba(34,197,94,.15)', color: '#22c55e', padding: '2px 7px', borderRadius: 4, fontSize: '.7rem', fontWeight: 700 }}>{dl.format}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  <button className="abtn abtn-sm" onClick={() => setExpandedDl(expandedDl === dl.id ? null : dl.id)}><i className="fas fa-edit" /></button>
                  <button className="abtn abtn-danger abtn-sm" onClick={() => deleteDownload(dl.id)}><i className="fas fa-trash" /></button>
                </div>
              </div>
              {expandedDl === dl.id && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,.07)' }}>
                  <EditDlInline dl={dl} mediaId={media.id} isTV={media.type === 'tv'} onSaved={(updated: any) => {
                    setDlList(prev => prev.map(d => d.id === dl.id ? { ...d, ...updated } : d))
                    setExpandedDl(null)
                  }} />
                </div>
              )}
            </div>
          ))}

          {addDlOpen && (
            <div style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: 16 }}>
              <div style={{ fontWeight: 700, color: '#f0f0f0', marginBottom: 14 }}><i className="fas fa-plus" style={{ color: 'var(--primary)', marginRight: 6 }} />Add Download Link</div>
              <div className="afg">
                <label className="afl">Title *</label>
                <input className="afc" placeholder="e.g. Movie (2160p WEB-DL DV HDR)" value={newDl.title} onChange={e => setNewDl(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="afr3">
                <div className="afg"><label className="afl">Quality</label><select className="afc" value={newDl.quality} onChange={e => setNewDl(p => ({ ...p, quality: e.target.value }))}><option value="">Select</option><option>2160p</option><option>1080p</option><option>720p</option><option>480p</option></select></div>
                <div className="afg"><label className="afl">Format</label><select className="afc" value={newDl.format} onChange={e => setNewDl(p => ({ ...p, format: e.target.value }))}><option value="">Select</option><option>WEB-DL</option><option>BluRay</option><option>WEBRip</option></select></div>
                <div className="afg"><label className="afl">HDR</label><select className="afc" value={newDl.hdr} onChange={e => setNewDl(p => ({ ...p, hdr: e.target.value }))}><option value="">None</option><option>DV HDR</option><option>HDR10+</option><option>HDR10</option><option>SDR</option></select></div>
              </div>
              <div className="afr">
                <div className="afg"><label className="afl">File Size</label><input className="afc" placeholder="e.g. 13.18 GB" value={newDl.file_size} onChange={e => setNewDl(p => ({ ...p, file_size: e.target.value }))} /></div>
                <div className="afg"><label className="afl">Audio</label><input className="afc" placeholder="Hindi, Tamil, English" value={newDl.audio} onChange={e => setNewDl(p => ({ ...p, audio: e.target.value }))} /></div>
              </div>
              {media.type === 'tv' && (
                <div className="afr">
                  <div className="afg"><label className="afl">Season # (0=all)</label><input type="number" className="afc" value={newDl.season_num} onChange={e => setNewDl(p => ({ ...p, season_num: e.target.value }))} min="0" /></div>
                  <div className="afg"><label className="afl">Episode # (0=full season)</label><input type="number" className="afc" value={newDl.episode_num} onChange={e => setNewDl(p => ({ ...p, episode_num: e.target.value }))} min="0" /></div>
                </div>
              )}
              <div className="afg"><label className="afl">Download URL(s)</label><textarea className="afc" rows={3} placeholder="Enter one URL per line" value={newDl.url} onChange={e => setNewDl(p => ({ ...p, url: e.target.value }))} /></div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="abtn abtn-primary" onClick={addDownload}><i className="fas fa-plus" /> Add Link</button>
                <button className="abtn" onClick={() => setAddDlOpen(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Episode Videos (TV only) */}
      {media.type === 'tv' && seasonsData.length > 0 && (
        <div className="ac">
          <div className="ac-head">
            <span><i className="fas fa-play-circle" style={{ color: 'var(--primary)', marginRight: 8 }} />Episode Custom Videos <span style={{ fontWeight: 400, fontSize: '.78rem', color: '#555' }}>(Alpha server per episode)</span></span>
            <span style={{ fontSize: '.75rem', color: '#555' }}>{Object.keys(evMap).length} URL(s) set</span>
          </div>
          <div style={{ padding: 18 }}>
            <p style={{ fontSize: '.82rem', color: '#666', marginBottom: 14 }}>
              Set a custom video URL per episode. It shows as the <strong style={{ color: 'var(--primary)' }}>Alpha</strong> server on the watch page for that episode.
            </p>
            {/* Season tabs */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
              {seasonsData.map((sea: any) => {
                const sn = sea.season_number
                const hasVids = Object.keys(evMap).some(k => k.startsWith(`${sn}-`))
                const isActive = sn === activeSeason
                return (
                  <button key={sn} onClick={() => { setActiveSeason(sn); if (seasonEps.length === 0 || activeSeason !== sn) loadSeasonEps(sn) }}
                    style={{ padding: '6px 16px', borderRadius: 20, fontSize: '.82rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .2s', border: `1px solid ${isActive ? 'var(--primary)' : 'rgba(255,255,255,.08)'}`, background: isActive ? 'var(--primary)' : '#1a1a1a', color: isActive ? '#000' : '#888' }}>
                    S{sn} {hasVids && <span style={{ width: 7, height: 7, borderRadius: '50%', background: isActive ? '#000' : '#22c55e', display: 'inline-block', marginLeft: 4, verticalAlign: 'middle' }} />}
                  </button>
                )
              })}
            </div>
            {activeSeason > 0 && (
              <div>
                {loadingEps && <div style={{ color: '#555', padding: '20px 0', textAlign: 'center' }}><i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }} />Loading episodes...</div>}
                {(seasonEps.length === 0 && !loadingEps) && (
                  <button className="abtn" onClick={() => loadSeasonEps(activeSeason)}><i className="fas fa-download" /> Load Season {activeSeason} Episodes</button>
                )}
                {seasonEps.map((ep: any) => {
                  const epNum = ep.episode_number
                  const key = `${activeSeason}-${epNum}`
                  const evRow = evMap[key]
                  const hasUrl = !!evRow?.video_url
                  const isExpanded = expandedEp === key
                  return (
                    <div key={epNum} style={{ background: '#1a1a1a', border: `1px solid ${hasUrl ? 'rgba(249,115,22,.35)' : 'rgba(255,255,255,.07)'}`, borderRadius: 10, padding: '12px 14px', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ background: hasUrl ? 'var(--primary)' : '#222', color: hasUrl ? '#000' : '#888', padding: '2px 9px', borderRadius: 4, fontSize: '.72rem', fontWeight: 800, flexShrink: 0 }}>EP {epNum}</span>
                        <span style={{ fontSize: '.85rem', fontWeight: 600, color: '#f0f0f0', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ep.name}</span>
                        {hasUrl && <span style={{ fontSize: '.65rem', fontWeight: 700, background: 'rgba(34,197,94,.15)', color: '#22c55e', padding: '2px 7px', borderRadius: 4, flexShrink: 0 }}><i className="fas fa-check" style={{ marginRight: 3 }} />Alpha Set</span>}
                        <button className="abtn abtn-sm" onClick={() => setExpandedEp(isExpanded ? null : key)}><i className={`fas fa-${hasUrl ? 'edit' : 'plus'}`} /></button>
                        {hasUrl && <button className="abtn abtn-danger abtn-sm" onClick={() => saveEpVideo(activeSeason, epNum, '')}><i className="fas fa-times" /></button>}
                      </div>
                      {hasUrl && !isExpanded && <div style={{ fontSize: '.72rem', color: '#555', marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{evRow.video_url}</div>}
                      {isExpanded && (
                        <EpVideoForm sn={activeSeason} en={epNum} currentUrl={evRow?.video_url || ''} onSave={(url: string) => saveEpVideo(activeSeason, epNum, url)} onCancel={() => setExpandedEp(null)} />
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function EpVideoForm({ sn, en, currentUrl, onSave, onCancel }: any) {
  const [url, setUrl] = useState(currentUrl)
  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,.07)' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <div className="afg" style={{ flex: 1, marginBottom: 0 }}>
          <label className="afl">Video URL for S{sn} E{en}</label>
          <input type="url" className="afc" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://your-host.com/video-id" />
        </div>
        <button className="abtn abtn-primary abtn-sm" onClick={() => onSave(url)} style={{ height: 38, flexShrink: 0 }}><i className="fas fa-save" /> Save</button>
        <button className="abtn abtn-sm" onClick={onCancel} style={{ height: 38, flexShrink: 0 }}>Cancel</button>
      </div>
    </div>
  )
}

function EditDlInline({ dl, mediaId, isTV, onSaved }: any) {
  const [form, setForm] = useState({ title: dl.title, quality: dl.quality || '', format: dl.format || '', codec: dl.codec || '', hdr: dl.hdr || '', file_size: dl.file_size || '', audio: dl.audio || '', url: dl.url || '', sort_order: dl.sort_order || 0, season_num: dl.season_num || '', episode_num: dl.episode_num || '' })
  const save = async () => {
    await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'edit_download', id: dl.id, ...form }) })
    onSaved(form)
  }
  return (
    <div>
      <div className="afg"><label className="afl">Title</label><input className="afc" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
      {isTV && (
        <div className="afr">
          <div className="afg"><label className="afl">Season #</label><input type="number" className="afc" value={form.season_num} onChange={e => setForm(p => ({ ...p, season_num: e.target.value }))} /></div>
          <div className="afg"><label className="afl">Episode #</label><input type="number" className="afc" value={form.episode_num} onChange={e => setForm(p => ({ ...p, episode_num: e.target.value }))} /></div>
        </div>
      )}
      <div className="afg"><label className="afl">Download URL(s)</label><textarea className="afc" rows={3} value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} /></div>
      <div style={{ display: 'flex', gap: 8 }}><button className="abtn abtn-primary abtn-sm" onClick={save}><i className="fas fa-save" /> Save</button></div>
    </div>
  )
}
