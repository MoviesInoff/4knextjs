import { tmdbFetch } from '@/lib/tmdb'
import { supabaseAdmin } from '@/lib/supabase'
import MediaCard from '@/components/ui/MediaCard'
import Link from 'next/link'

const MOVIE_GENRES = [
  { id: 28, name: 'Action' }, { id: 12, name: 'Adventure' }, { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' }, { id: 80, name: 'Crime' }, { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' }, { id: 10751, name: 'Family' }, { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' }, { id: 27, name: 'Horror' }, { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' }, { id: 10749, name: 'Romance' }, { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' }, { id: 10752, name: 'War' }, { id: 37, name: 'Western' },
]
const TV_GENRES = [
  { id: 10759, name: 'Action & Adventure' }, { id: 16, name: 'Animation' }, { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' }, { id: 99, name: 'Documentary' }, { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' }, { id: 10762, name: 'Kids' }, { id: 9648, name: 'Mystery' },
  { id: 10763, name: 'News' }, { id: 10764, name: 'Reality' }, { id: 10765, name: 'Sci-Fi & Fantasy' },
  { id: 10766, name: 'Soap' }, { id: 10767, name: 'Talk' }, { id: 10768, name: 'War & Politics' },
  { id: 37, name: 'Western' },
]

export const revalidate = 3600

export default async function GenresPage({ searchParams }: { searchParams: any }) {
  const sp = await searchParams
  const genreId = sp.genre ? parseInt(sp.genre) : null
  const mediaType = sp.type === 'tv' ? 'tv' : 'movie'
  const page = Math.max(1, parseInt(sp.page || '1'))

  if (!genreId) {
    return (
      <section className="section" style={{ paddingTop: 'calc(var(--header-h) + 24px)' }}>
        <div className="section-head">
          <div className="section-title"><i className="fas fa-tags icon" /> Genres</div>
        </div>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <Link href="/genres?type=movie" className={`btn btn-sm ${mediaType === 'movie' ? 'btn-primary' : 'btn-dark'}`}>Movies</Link>
            <Link href="/genres?type=tv" className={`btn btn-sm ${mediaType === 'tv' ? 'btn-primary' : 'btn-dark'}`}>TV Series</Link>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {(mediaType === 'movie' ? MOVIE_GENRES : TV_GENRES).map(g => (
              <Link key={g.id} href={`/genres?genre=${g.id}&type=${mediaType}`}
                style={{ padding: '8px 18px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 20, fontSize: '.85rem', color: 'var(--text2)', transition: 'all .2s' }}
                className="genre-pill">
                {g.name}
              </Link>
            ))}
          </div>
        </div>
        <style>{`.genre-pill:hover{background:var(--primary)!important;color:#000!important;border-color:var(--primary)!important}`}</style>
      </section>
    )
  }

  const allGenres = [...MOVIE_GENRES, ...TV_GENRES]
  const currentGenre = allGenres.find(g => g.id === genreId)
  const data = await tmdbFetch(`/discover/${mediaType}`, { with_genres: genreId, sort_by: 'popularity.desc', 'vote_count.gte': 20, page })
  const items = (data.results || []).map((m: any) => ({ ...m, _type: mediaType }))
  const totalPages = Math.min(data.total_pages || 1, 20)
  const bUrl = `/genres?genre=${genreId}&type=${mediaType}`

  const allIds = items.map((m: any) => m.id)
  let localTagsMap: Record<number, string[]> = {}
  if (allIds.length) {
    const { data: rows } = await supabaseAdmin.from('media').select('tmdb_id, tags').in('tmdb_id', allIds)
    for (const row of rows || []) { if (row.tags?.length) localTagsMap[row.tmdb_id] = row.tags }
  }

  return (
    <section className="section" style={{ paddingTop: 'calc(var(--header-h) + 24px)' }}>
      <div className="section-head">
        <div className="section-title">
          <i className="fas fa-tags icon" /> {currentGenre?.name || 'Genre'}
          <span style={{ fontFamily: 'var(--font)', fontSize: '.8rem', fontWeight: 400, color: 'var(--text3)', marginLeft: 8 }}>{mediaType === 'tv' ? 'TV' : 'Movies'}</span>
        </div>
        <Link href="/genres" className="btn btn-dark btn-sm"><i className="fas fa-arrow-left" /> All Genres</Link>
      </div>
      <div className="cards-grid-lg">
        {items.map((m: any) => <MediaCard key={m.id} item={m} localTags={localTagsMap[m.id]} />)}
      </div>
      {totalPages > 1 && (
        <div className="pagination">
          {page > 1 && <Link href={`${bUrl}&page=${page - 1}`} className="ppage"><i className="fas fa-chevron-left" /></Link>}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pg = Math.max(1, page - 2) + i
            if (pg > totalPages) return null
            return <Link key={pg} href={`${bUrl}&page=${pg}`} className={`ppage ${pg === page ? 'active' : ''}`}>{pg}</Link>
          })}
          {page < totalPages && <Link href={`${bUrl}&page=${page + 1}`} className="ppage"><i className="fas fa-chevron-right" /></Link>}
        </div>
      )}
    </section>
  )
}
