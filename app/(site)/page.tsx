import { tmdbFetch } from '@/lib/tmdb'
import { getAllSettings } from '@/lib/settings'
import { supabaseAdmin } from '@/lib/supabase'
import HeroSlider from '@/components/ui/HeroSlider'
import TelegramBanner from '@/components/ui/TelegramBanner'
import MediaCard from '@/components/ui/MediaCard'
import Link from 'next/link'

export const revalidate = 3600

export default async function HomePage({ searchParams }: { searchParams: { page?: string } }) {
  const page = Math.max(1, parseInt((await searchParams).page || '1'))
  const settings = await getAllSettings()
  const perPage = parseInt(settings.homepage_count || '20')
  const showSlider = settings.show_hero_slider !== '0'

  const [heroData, animeTV, animeMovie] = await Promise.all([
    showSlider ? tmdbFetch('/discover/tv', { with_keywords: '210024', sort_by: 'popularity.desc', 'vote_count.gte': 100, page: 1 }) : { results: [] },
    tmdbFetch('/discover/tv', { with_keywords: '210024', sort_by: 'popularity.desc', 'vote_count.gte': 20, page }),
    tmdbFetch('/discover/movie', { with_keywords: '210024', sort_by: 'popularity.desc', 'vote_count.gte': 20, page }),
  ])

  const heroItems = (heroData.results || []).slice(0, 6)
  const tvItems = (animeTV.results || []).map((m: any) => ({ ...m, _type: 'tv' }))
  const movieItems = (animeMovie.results || []).map((m: any) => ({ ...m, _type: 'movie' }))

  const combined: any[] = []
  let ti = 0, mi = 0
  while (ti < tvItems.length || mi < movieItems.length) {
    if (ti < tvItems.length) combined.push(tvItems[ti++])
    if (mi < movieItems.length) combined.push(movieItems[mi++])
  }
  const items = combined.slice(0, perPage)
  const totalPages = Math.min(Math.max(animeTV.total_pages || 1, animeMovie.total_pages || 1), 20)

  // Get local tags
  const allIds = items.map((m: any) => m.id)
  let localTagsMap: Record<number, string[]> = {}
  if (allIds.length) {
    const { data } = await supabaseAdmin.from('media').select('tmdb_id, tags').in('tmdb_id', allIds)
    for (const row of data || []) {
      if (row.tags?.length) localTagsMap[row.tmdb_id] = row.tags
    }
  }

  return (
    <>
      {showSlider && heroItems.length > 0 && <HeroSlider items={heroItems} />}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px' }}>
        <TelegramBanner link={settings.social_telegram || ''} />
      </div>
      <section className="section">
        <div className="section-head">
          <div className="section-title"><i className="fas fa-fire icon" /> Popular Anime</div>
          <span style={{ fontSize: '.8rem', color: 'var(--text3)' }}>Page {page} / {totalPages}</span>
        </div>
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text3)' }}>
            <i className="fas fa-film" style={{ fontSize: '2rem', marginBottom: 12, display: 'block' }} />
            <h3>No content found</h3>
            <p>Check your TMDB API key in <Link href="/admin/api-settings" style={{ color: 'var(--primary)' }}>settings</Link>.</p>
          </div>
        ) : (
          <>
            <div className="cards-grid-lg">
              {items.map((m: any) => (
                <MediaCard key={`${m._type}-${m.id}`} item={m} localTags={localTagsMap[m.id]} />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="pagination">
                {page > 1 && <Link href={`/?page=${page - 1}`} className="ppage"><i className="fas fa-chevron-left" /></Link>}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pg = Math.max(1, page - 2) + i
                  if (pg > totalPages) return null
                  return <Link key={pg} href={`/?page=${pg}`} className={`ppage ${pg === page ? 'active' : ''}`}>{pg}</Link>
                })}
                {page < totalPages && <Link href={`/?page=${page + 1}`} className="ppage"><i className="fas fa-chevron-right" /></Link>}
              </div>
            )}
          </>
        )}
      </section>
    </>
  )
}
