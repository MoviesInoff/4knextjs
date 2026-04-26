import { tmdbFetch } from '@/lib/tmdb'
import { supabaseAdmin } from '@/lib/supabase'
import MediaCard from '@/components/ui/MediaCard'
import Link from 'next/link'

export const revalidate = 3600

export default async function AnimePage({ searchParams }: { searchParams: any }) {
  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.page || '1'))

  const [animeTV, animeMovie] = await Promise.all([
    tmdbFetch('/discover/tv', { with_keywords: '210024', sort_by: 'popularity.desc', 'vote_count.gte': 20, page }),
    tmdbFetch('/discover/movie', { with_keywords: '210024', sort_by: 'popularity.desc', 'vote_count.gte': 20, page }),
  ])

  const tvItems = (animeTV.results || []).map((m: any) => ({ ...m, _type: 'tv' }))
  const movieItems = (animeMovie.results || []).map((m: any) => ({ ...m, _type: 'movie' }))
  const combined: any[] = []
  let ti = 0, mi = 0
  while (ti < tvItems.length || mi < movieItems.length) {
    if (ti < tvItems.length) combined.push(tvItems[ti++])
    if (mi < movieItems.length) combined.push(movieItems[mi++])
  }
  const items = combined.slice(0, 40)
  const totalPages = Math.min(Math.max(animeTV.total_pages || 1, animeMovie.total_pages || 1), 20)

  const allIds = items.map((m: any) => m.id)
  let localTagsMap: Record<number, string[]> = {}
  if (allIds.length) {
    const { data } = await supabaseAdmin.from('media').select('tmdb_id, tags').in('tmdb_id', allIds)
    for (const row of data || []) { if (row.tags?.length) localTagsMap[row.tmdb_id] = row.tags }
  }

  return (
    <section className="section" style={{ paddingTop: 'calc(var(--header-h) + 24px)' }}>
      <div className="section-head">
        <div className="section-title"><i className="fas fa-dragon icon" /> Anime</div>
        <span style={{ fontSize: '.8rem', color: 'var(--text3)' }}>Page {page} / {totalPages}</span>
      </div>
      <div className="cards-grid-lg">
        {items.map((m: any) => <MediaCard key={`${m._type}-${m.id}`} item={m} localTags={localTagsMap[m.id]} />)}
      </div>
      {totalPages > 1 && (
        <div className="pagination">
          {page > 1 && <Link href={`/anime?page=${page-1}`} className="ppage"><i className="fas fa-chevron-left" /></Link>}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pg = Math.max(1, page - 2) + i
            if (pg > totalPages) return null
            return <Link key={pg} href={`/anime?page=${pg}`} className={`ppage ${pg === page ? 'active' : ''}`}>{pg}</Link>
          })}
          {page < totalPages && <Link href={`/anime?page=${page+1}`} className="ppage"><i className="fas fa-chevron-right" /></Link>}
        </div>
      )}
    </section>
  )
}
