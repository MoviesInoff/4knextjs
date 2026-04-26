import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import MediaCard from '@/components/ui/MediaCard'
import Link from 'next/link'

export default async function WatchlistPage() {
  const user = await getSession()
  if (!user) redirect('/login')

  const { data: items } = await supabaseAdmin
    .from('watchlist')
    .select('added_at, media(id, tmdb_id, type, title, poster_path, year, vote_average, tags)')
    .eq('user_id', user.id)
    .order('added_at', { ascending: false })

  const mediaItems = (items || []).map((wl: any) => ({
    ...wl.media,
    _type: wl.media?.type,
    id: wl.media?.tmdb_id,
  })).filter(Boolean)

  return (
    <section className="section" style={{ paddingTop: 'calc(var(--header-h) + 24px)' }}>
      <div className="section-head">
        <div className="section-title"><i className="fas fa-bookmark icon" /> My Watchlist</div>
        <span style={{ fontSize: '.8rem', color: 'var(--text3)' }}>{mediaItems.length} title{mediaItems.length !== 1 ? 's' : ''}</span>
      </div>

      {mediaItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text3)' }}>
          <i className="fas fa-bookmark" style={{ fontSize: '3rem', marginBottom: 16, display: 'block', opacity: .3 }} />
          <h3 style={{ marginBottom: 8 }}>Your watchlist is empty</h3>
          <p style={{ marginBottom: 24 }}>Save movies and shows to watch later</p>
          <Link href="/" className="btn btn-primary"><i className="fas fa-fire" /> Browse Anime</Link>
        </div>
      ) : (
        <div className="cards-grid-lg">
          {mediaItems.map((m: any) => (
            <MediaCard key={`${m._type}-${m.id}`} item={m} localTags={m.tags} />
          ))}
        </div>
      )}
    </section>
  )
}
