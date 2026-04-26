import { tmdbFetch } from '@/lib/tmdb'
import { getAllSettings } from '@/lib/settings'
import { supabaseAdmin } from '@/lib/supabase'
import MediaCard from '@/components/ui/MediaCard'
import Link from 'next/link'

export const revalidate = 3600

export default async function MoviesPage({ searchParams }: { searchParams: any }) {
  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.page || '1'))
  const sort = sp.sort || 'popular'
  const settings = await getAllSettings()
  const perPage = parseInt(settings.items_per_page || '20')

  const endpoint = sort === 'top_rated' ? '/movie/top_rated' : '/trending/movie/week'
  const data = await tmdbFetch(endpoint, { page })
  const items = (data.results || []).map((m: any) => ({ ...m, _type: 'movie' })).slice(0, perPage)
  const totalPages = Math.min(data.total_pages || 1, 20)

  const allIds = items.map((m: any) => m.id)
  let localTagsMap: Record<number, string[]> = {}
  if (allIds.length) {
    const { data: rows } = await supabaseAdmin.from('media').select('tmdb_id, tags').in('tmdb_id', allIds)
    for (const row of rows || []) { if (row.tags?.length) localTagsMap[row.tmdb_id] = row.tags }
  }

  const bUrl = `/movies?sort=${sort}`

  return (
    <section className="section" style={{ paddingTop: 'calc(var(--header-h) + 24px)' }}>
      <div className="section-head">
        <div className="section-title"><i className="fas fa-film icon" /> Movies</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/movies?sort=popular" className={`btn btn-sm ${sort === 'popular' ? 'btn-primary' : 'btn-dark'}`}>Popular</Link>
          <Link href="/movies?sort=top_rated" className={`btn btn-sm ${sort === 'top_rated' ? 'btn-primary' : 'btn-dark'}`}>Top Rated</Link>
        </div>
      </div>
      <div className="cards-grid-lg">
        {items.map((m: any) => <MediaCard key={m.id} item={m} localTags={localTagsMap[m.id]} />)}
      </div>
      {totalPages > 1 && (
        <div className="pagination">
          {page > 1 && <Link href={`${bUrl}&page=${page-1}`} className="ppage"><i className="fas fa-chevron-left" /></Link>}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pg = Math.max(1, page - 2) + i
            if (pg > totalPages) return null
            return <Link key={pg} href={`${bUrl}&page=${pg}`} className={`ppage ${pg === page ? 'active' : ''}`}>{pg}</Link>
          })}
          {page < totalPages && <Link href={`${bUrl}&page=${page+1}`} className="ppage"><i className="fas fa-chevron-right" /></Link>}
        </div>
      )}
    </section>
  )
}
