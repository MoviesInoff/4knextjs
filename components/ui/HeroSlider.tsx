'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { tmdbImg } from '@/lib/tmdb'

export default function HeroSlider({ items }: { items: any[] }) {
  const [cur, setCur] = useState(0)

  const show = useCallback((n: number) => {
    setCur((n + items.length) % items.length)
  }, [items.length])

  useEffect(() => {
    if (items.length <= 1) return
    const t = setInterval(() => show(cur + 1), 6000)
    return () => clearInterval(t)
  }, [cur, show, items.length])

  if (!items.length) return null

  const item = items[cur]
  const isTV = !item.title || !!item.name
  const title = isTV ? item.name : item.title
  const overview = item.overview || ''
  const bdUrl = item.backdrop_path ? tmdbImg(item.backdrop_path, 'w1280') : ''
  const year = (isTV ? item.first_air_date : item.release_date || '').slice(0, 4)
  const rating = parseFloat(item.vote_average || 0).toFixed(1)
  const tmdbId = item.id
  const watchUrl = isTV ? `/watch?id=${tmdbId}&type=tv` : `/watch?id=${tmdbId}&type=movie`
  const detailUrl = isTV ? `/series?id=${tmdbId}` : `/movie?id=${tmdbId}`
  const badge = isTV ? 'ANIME' : 'ANIME MOVIE'

  return (
    <div className="hero-slider-wrap" style={{ paddingTop: 'var(--header-h)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'relative', minHeight: 'clamp(340px,60vw,560px)' }}>
        {bdUrl && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
            <img src={bdUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', filter: 'brightness(.65)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,rgba(13,13,13,.72) 0%,rgba(13,13,13,.32) 55%,rgba(13,13,13,.04) 100%),linear-gradient(0deg,var(--bg) 0%,transparent 40%)' }} />
          </div>
        )}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: 'clamp(40px,8vw,90px) 20px clamp(50px,9vw,100px)' }}>
          <div style={{ maxWidth: 580 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.2rem,6vw,4.8rem)', letterSpacing: 1, color: '#fff', lineHeight: .93, marginBottom: 14, textShadow: '0 2px 20px rgba(0,0,0,.4)' }}>
              {title}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 18, fontSize: '.875rem', color: 'rgba(255,255,255,.8)' }}>
              {year && <span>{year}</span>}
              {parseFloat(item.vote_average) > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#fbbf24' }}>
                  <i className="fas fa-star" style={{ fontSize: '.75rem' }} />{rating}/10
                </span>
              )}
              <span style={{ background: 'var(--primary)', color: '#000', padding: '2px 10px', borderRadius: 4, fontSize: '.7rem', fontWeight: 700 }}>{badge}</span>
            </div>
            {overview && (
              <p style={{ color: 'rgba(255,255,255,.7)', fontSize: '.9rem', lineHeight: 1.7, marginBottom: 28, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {overview}
              </p>
            )}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href={watchUrl} className="btn btn-primary btn-lg"><i className="fas fa-play" /> Watch Now</Link>
              <Link href={detailUrl} className="btn btn-lg" style={{ background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.3)', color: '#fff' }}>
                <i className="fas fa-info-circle" /> Details
              </Link>
            </div>
          </div>
        </div>
      </div>

      {items.length > 1 && (
        <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, zIndex: 5, display: 'flex', justifyContent: 'center', gap: 6 }}>
          {items.map((_, i) => (
            <div key={i} onClick={() => show(i)}
              style={{ width: i === cur ? 24 : 8, height: 8, borderRadius: 4, cursor: 'pointer', transition: 'all .3s', background: i === cur ? 'var(--primary)' : 'rgba(255,255,255,.3)' }} />
          ))}
        </div>
      )}
    </div>
  )
}
