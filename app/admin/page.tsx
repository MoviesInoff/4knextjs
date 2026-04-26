import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'

export default async function AdminDashboard() {
  const [
    { count: totalMedia },
    { count: totalMovies },
    { count: totalSeries },
    { count: totalUsers },
    { count: totalDL },
    { data: recentImports },
  ] = await Promise.all([
    supabaseAdmin.from('media').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('media').select('*', { count: 'exact', head: true }).eq('type', 'movie'),
    supabaseAdmin.from('media').select('*', { count: 'exact', head: true }).eq('type', 'tv'),
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('download_links').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('media').select('id, tmdb_id, type, title, year, tags, status, poster_path').order('created_at', { ascending: false }).limit(10),
  ])

  const stats = [
    { label: 'Total Media', value: totalMedia || 0, icon: 'photo-film', color: '#f97316' },
    { label: 'Movies', value: totalMovies || 0, icon: 'film', color: '#3b82f6' },
    { label: 'Series', value: totalSeries || 0, icon: 'tv', color: '#22c55e' },
    { label: 'Users', value: totalUsers || 0, icon: 'users', color: '#a855f7' },
    { label: 'DL Links', value: totalDL || 0, icon: 'download', color: '#ef4444' },
  ]

  const quickActions = [
    { href: '/admin/import', label: 'Import from TMDB', icon: 'cloud-download-alt', primary: true },
    { href: '/admin/media-list', label: 'Manage Media', icon: 'film', primary: false },
    { href: '/admin/embed-servers', label: 'Embed Servers', icon: 'server', primary: false },
    { href: '/admin/settings', label: 'Settings', icon: 'cog', primary: false },
    { href: '/admin/api-settings', label: 'API Settings', icon: 'key', primary: false },
  ]

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: '#f0f0f0', fontSize: '1.2rem', fontWeight: 700, marginBottom: 4 }}>Dashboard</h1>
        <p style={{ color: '#555', fontSize: '.8rem' }}>Overview &amp; Quick Stats</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 14, marginBottom: 24 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: '#111', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: s.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className={`fas fa-${s.icon}`} style={{ color: s.color, fontSize: '.85rem' }} />
              </div>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f0f0f0', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: '.72rem', color: '#555', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>
        {/* Recent imports */}
        <div className="ac">
          <div className="ac-head">
            <span>Recent Imports</span>
            <Link href="/admin/media-list" className="abtn abtn-sm">View All</Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="atable">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>Poster</th>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Year</th>
                  <th>Tags</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(recentImports || []).map((m: any) => (
                  <tr key={m.id}>
                    <td>
                      <img src={m.poster_path ? `https://image.tmdb.org/t/p/w92${m.poster_path}` : '/images/no-poster.jpg'}
                        style={{ width: 32, height: 48, objectFit: 'cover', borderRadius: 4 }} alt="" />
                    </td>
                    <td><strong style={{ color: '#f0f0f0', fontSize: '.85rem' }}>{m.title}</strong></td>
                    <td>
                      <span style={{ background: m.type === 'tv' ? 'rgba(59,130,246,.15)' : 'rgba(249,115,22,.15)', color: m.type === 'tv' ? '#3b82f6' : '#f97316', padding: '2px 7px', borderRadius: 4, fontSize: '.68rem', fontWeight: 700 }}>
                        {m.type === 'tv' ? 'TV' : 'MOVIE'}
                      </span>
                    </td>
                    <td style={{ color: '#888', fontSize: '.82rem' }}>{m.year}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        {(m.tags || []).slice(0, 2).map((t: string) => (
                          <span key={t} style={{ background: '#222', color: '#888', padding: '1px 6px', borderRadius: 4, fontSize: '.65rem', fontWeight: 700 }}>{t}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span style={{ background: m.status === 'published' ? 'rgba(34,197,94,.12)' : 'rgba(107,114,128,.12)', color: m.status === 'published' ? '#22c55e' : '#9ca3af', padding: '2px 7px', borderRadius: 4, fontSize: '.68rem', fontWeight: 700 }}>
                        {m.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td>
                      <Link href={`/admin/edit-media?id=${m.id}`} className="abtn abtn-sm"><i className="fas fa-edit" /></Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick actions + API status */}
        <div>
          <div className="ac" style={{ marginBottom: 16 }}>
            <div className="ac-head"><span>Quick Actions</span></div>
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {quickActions.map(a => (
                <Link key={a.href} href={a.href} className={`abtn ${a.primary ? 'abtn-primary' : ''}`} style={{ justifyContent: 'center' }}>
                  <i className={`fas fa-${a.icon}`} /> {a.label}
                </Link>
              ))}
            </div>
          </div>
          <APIStatusCard />
        </div>
      </div>
    </div>
  )
}

async function APIStatusCard() {
  const { data } = await supabaseAdmin.from('settings').select('setting_value').eq('setting_key', 'tmdb_api_key').single()
  const hasKey = !!(data?.setting_value)
  return (
    <div className="ac">
      <div className="ac-head"><span>API Status</span></div>
      <div style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: hasKey ? '#22c55e' : '#ef4444' }} />
          <span style={{ fontSize: '.85rem', color: hasKey ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
            {hasKey ? 'Connected' : 'Not configured'}
          </span>
        </div>
        <Link href="/admin/api-settings" className="abtn abtn-sm abtn-full">
          <i className="fas fa-key" /> {hasKey ? 'Update Key' : 'Set API Key'}
        </Link>
      </div>
    </div>
  )
}
