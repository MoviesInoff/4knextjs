import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import DeleteMediaBtn from './DeleteMediaBtn'

export default async function MediaListPage({ searchParams }: { searchParams: any }) {
  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.page || '1'))
  const type = sp.type || 'all'
  const search = sp.q || ''
  const perPage = 20
  const from = (page - 1) * perPage

  let query = supabaseAdmin.from('media').select('id, tmdb_id, type, title, year, tags, status, poster_path, vote_average', { count: 'exact' })
  if (type !== 'all') query = query.eq('type', type)
  if (search) query = query.ilike('title', `%${search}%`)
  const { data: items, count } = await query.order('created_at', { ascending: false }).range(from, from + perPage - 1)

  const totalPages = Math.ceil((count || 0) / perPage)
  const bUrl = `/admin/media-list?type=${type}&q=${encodeURIComponent(search)}`

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ color: '#f0f0f0', fontSize: '1.2rem', fontWeight: 700, marginBottom: 4 }}>All Media</h1>
          <p style={{ color: '#555', fontSize: '.8rem' }}>{count || 0} titles in database</p>
        </div>
        <Link href="/admin/import" className="abtn abtn-primary"><i className="fas fa-plus" /> Import New</Link>
      </div>

      {/* Filters */}
      <form method="GET" action="/admin/media-list" style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="asearch-wrap" style={{ flex: 1, minWidth: 160 }}>
          <i className="fas fa-search si" />
          <input type="text" name="q" className="afc" placeholder="Search title..." defaultValue={search} style={{ paddingLeft: 34 }} />
        </div>
        <select name="type" className="afc" defaultValue={type} style={{ width: 'auto' }}>
          <option value="all">All Types</option>
          <option value="movie">Movies</option>
          <option value="tv">TV Series</option>
        </select>
        <button type="submit" className="abtn abtn-primary">Filter</button>
        {(search || type !== 'all') && <Link href="/admin/media-list" className="abtn">Reset</Link>}
      </form>

      <div className="ac">
        <div style={{ overflowX: 'auto' }}>
          <table className="atable">
            <thead>
              <tr>
                <th style={{ width: 50 }}>Poster</th>
                <th>Title</th>
                <th>Type</th>
                <th>Year</th>
                <th>Rating</th>
                <th>Tags</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(items || []).map((m: any) => (
                <tr key={m.id}>
                  <td>
                    <img src={m.poster_path ? `https://image.tmdb.org/t/p/w92${m.poster_path}` : '/images/no-poster.jpg'}
                      style={{ width: 34, height: 51, objectFit: 'cover', borderRadius: 4 }} alt="" />
                  </td>
                  <td><strong style={{ color: '#f0f0f0', fontSize: '.85rem' }}>{m.title}</strong></td>
                  <td>
                    <span style={{ background: m.type === 'tv' ? 'rgba(59,130,246,.15)' : 'rgba(249,115,22,.15)', color: m.type === 'tv' ? '#3b82f6' : '#f97316', padding: '2px 7px', borderRadius: 4, fontSize: '.68rem', fontWeight: 700 }}>
                      {m.type === 'tv' ? 'TV' : 'MOVIE'}
                    </span>
                  </td>
                  <td style={{ color: '#888', fontSize: '.82rem' }}>{m.year}</td>
                  <td style={{ color: '#fbbf24', fontSize: '.82rem' }}><i className="fas fa-star" style={{ fontSize: '.7rem' }} /> {parseFloat(m.vote_average || 0).toFixed(1)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 3 }}>
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
                    <div style={{ display: 'flex', gap: 5 }}>
                      <Link href={m.type === 'tv' ? `/series?id=${m.tmdb_id}` : `/movie?id=${m.tmdb_id}`} target="_blank" className="abtn abtn-sm" title="View"><i className="fas fa-eye" /></Link>
                      <Link href={`/admin/edit-media?id=${m.id}`} className="abtn abtn-sm abtn-primary" title="Edit"><i className="fas fa-edit" /> Edit</Link>
                      <DeleteMediaBtn id={m.id} title={m.title} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="apag">
            {page > 1 && <Link href={`${bUrl}&page=${page - 1}`}><i className="fas fa-chevron-left" /></Link>}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pg = Math.max(1, page - 2) + i
              if (pg > totalPages) return null
              return <Link key={pg} href={`${bUrl}&page=${pg}`} className={pg === page ? 'active' : ''}>{pg}</Link>
            })}
            {page < totalPages && <Link href={`${bUrl}&page=${page + 1}`}><i className="fas fa-chevron-right" /></Link>}
          </div>
        )}
      </div>
    </div>
  )
}
