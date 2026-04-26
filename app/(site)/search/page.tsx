import { tmdbFetch } from '@/lib/tmdb'
import MediaCard from '@/components/ui/MediaCard'
import Link from 'next/link'

export default async function SearchPage({ searchParams }: { searchParams: any }) {
  const sp = await searchParams
  const q = sp.q || ''
  const page = Math.max(1, parseInt(sp.page || '1'))

  if (!q) return (
    <section className="section" style={{ paddingTop: 'calc(var(--header-h) + 24px)' }}>
      <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text3)' }}>
        <i className="fas fa-search" style={{ fontSize: '3rem', marginBottom: 16, display: 'block', color: 'var(--primary)' }} />
        <h2 style={{ fontSize: '1.5rem', marginBottom: 8 }}>Search for movies &amp; shows</h2>
        <p>Use the search bar at the top to find content.</p>
      </div>
    </section>
  )

  const [moviesData, tvData] = await Promise.all([
    tmdbFetch('/search/movie', { query: q, page }),
    tmdbFetch('/search/tv', { query: q, page }),
  ])

  const items = [
    ...(moviesData.results || []).map((m: any) => ({ ...m, _type: 'movie' })),
    ...(tvData.results || []).map((m: any) => ({ ...m, _type: 'tv' })),
  ].sort((a, b) => (b.popularity || 0) - (a.popularity || 0))

  const totalPages = Math.min(Math.max(moviesData.total_pages || 1, tvData.total_pages || 1), 10)
  const total = (moviesData.total_results || 0) + (tvData.total_results || 0)
  const bUrl = `/search?q=${encodeURIComponent(q)}`

  return (
    <section className="section" style={{ paddingTop: 'calc(var(--header-h) + 24px)' }}>
      <div className="section-head">
        <div className="section-title"><i className="fas fa-search icon" /> Search Results</div>
        <span style={{ fontSize: '.8rem', color: 'var(--text3)' }}>{total} results for &ldquo;{q}&rdquo;</span>
      </div>
      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text3)' }}>
          <i className="fas fa-search" style={{ fontSize: '2rem', marginBottom: 12, display: 'block' }} />
          <h3>No results found for &ldquo;{q}&rdquo;</h3>
        </div>
      ) : (
        <>
          <div className="cards-grid-lg">
            {items.map((m: any) => <MediaCard key={`${m._type}-${m.id}`} item={m} />)}
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
        </>
      )}
    </section>
  )
}
