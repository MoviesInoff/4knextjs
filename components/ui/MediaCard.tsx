import Link from 'next/link'
import { tmdbImg, getTagClass } from '@/lib/tmdb'

export default function MediaCard({ item, localTags }: { item: any, localTags?: string[] }) {
  const isTV = item._type === 'tv' || item.type === 'tv'
  const title = isTV ? (item.name || item.title || '') : (item.title || item.name || '')
  const poster = item.poster_path ? tmdbImg(item.poster_path, 'w342') : '/images/no-poster.jpg'
  const year = (isTV ? item.first_air_date : item.release_date || '').slice(0, 4)
  const rating = parseFloat(item.vote_average || 0).toFixed(1)
  const href = isTV ? `/series?id=${item.id || item.tmdb_id}` : `/movie?id=${item.id || item.tmdb_id}`
  const tags: string[] = localTags || (Array.isArray(item.tags) ? item.tags : [])

  return (
    <div className="card">
      <div className="card-poster-wrap">
        <Link href={href}>
          <img src={poster} className="card-poster" alt={title} loading="lazy" />
        </Link>
        {isTV && <div className="card-tv-badge">TV</div>}
        {tags.length > 0 && (
          <div className="card-tags">
            {tags.slice(0, 3).map((tag: string) => (
              <span key={tag} className={`tag ${getTagClass(tag)}`}>{tag.toUpperCase()}</span>
            ))}
          </div>
        )}
        <div className="card-overlay">
          <Link href={href} className="card-play"><i className="fas fa-play" /></Link>
        </div>
      </div>
      <Link href={href} className="card-info">
        <div className="card-title">{title}</div>
        <div className="card-meta">
          <span>{year}{isTV ? ' · TV' : ''}</span>
          <span className="card-rating"><i className="fas fa-star" style={{ fontSize: '.65rem' }} /> {rating}</span>
        </div>
      </Link>
    </div>
  )
}
