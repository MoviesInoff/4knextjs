import { tmdbFetch, tmdbImg, getTagClass } from '@/lib/tmdb'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { getAllSettings } from '@/lib/settings'
import Link from 'next/link'
import MediaCard from '@/components/ui/MediaCard'
import TelegramBanner from '@/components/ui/TelegramBanner'

export default async function SeriesDetailPage({ searchParams }: { searchParams: any }) {
  const sp = await searchParams
  const tmdbId = parseInt(sp.id || '0')
  if (!tmdbId) return <div style={{ padding: 40, textAlign: 'center' }}>Series not found.</div>

  const [detail, settings, session] = await Promise.all([
    tmdbFetch(`/tv/${tmdbId}`, { append_to_response: 'credits,videos,similar,recommendations,external_ids' }),
    getAllSettings(),
    getSession(),
  ])

  const { data: localMedia } = await supabaseAdmin.from('media').select('*, download_links(*)').eq('tmdb_id', tmdbId).eq('type', 'tv').single()

  const title = detail.name || ''
  const overview = detail.overview || ''
  const year = (detail.first_air_date || '').slice(0, 4)
  const rating = parseFloat(detail.vote_average || 0).toFixed(1)
  const poster = detail.poster_path ? tmdbImg(detail.poster_path, 'w500') : '/images/no-poster.jpg'
  const backdrop = detail.backdrop_path ? tmdbImg(detail.backdrop_path, 'w1280') : ''
  const genres = detail.genres || []
  const seasons = (detail.seasons || []).filter((s: any) => s.season_number > 0)
  const cast = (detail.credits?.cast || []).slice(0, 10)
  const similar = [...(detail.recommendations?.results || []), ...(detail.similar?.results || [])].slice(0, 12)
  const trailerKey = detail.videos?.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube')?.key
  const imdbId = detail.external_ids?.imdb_id || ''
  const tags: string[] = localMedia?.tags || []
  const downloads = localMedia?.download_links || []

  let inWatchlist = false
  if (session && localMedia) {
    const { data: wl } = await supabaseAdmin.from('watchlist').select('id').eq('user_id', session.id).eq('media_id', localMedia.id).single()
    inWatchlist = !!wl
  }

  return (
    <div style={{ paddingTop: 'var(--header-h)', background: 'var(--bg)', minHeight: '100vh' }}>
      {backdrop && (
        <div style={{ position: 'relative', width: '100%', height: 'clamp(200px,40vw,420px)', overflow: 'hidden' }}>
          <img src={backdrop} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', filter: 'brightness(.5)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, var(--bg) 0%, transparent 60%)' }} />
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px' }}>
        <TelegramBanner link={settings.social_telegram || ''} />

        <div style={{ display: 'flex', gap: 24, marginBottom: 32, marginTop: backdrop ? -120 : 24, position: 'relative', zIndex: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <img src={poster} alt={title} style={{ width: 180, minWidth: 180, borderRadius: 12, boxShadow: '0 8px 40px rgba(0,0,0,.7)' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem,4vw,3rem)', letterSpacing: 1, color: 'var(--text)', marginBottom: 12 }}>{title}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12, fontSize: '.85rem', color: 'var(--text3)' }}>
              {year && <span><i className="fas fa-calendar" style={{ color: 'var(--primary)', marginRight: 4 }} />{year}</span>}
              {parseFloat(rating) > 0 && <span><i className="fas fa-star" style={{ color: '#fbbf24', marginRight: 4 }} />{rating}/10</span>}
              {seasons.length > 0 && <span><i className="fas fa-layer-group" style={{ color: 'var(--primary)', marginRight: 4 }} />{seasons.length} Season{seasons.length !== 1 ? 's' : ''}</span>}
              <span style={{ background: 'var(--primary)', color: '#000', padding: '2px 9px', borderRadius: 4, fontSize: '.68rem', fontWeight: 700 }}>SERIES</span>
              {imdbId && <a href={`https://www.imdb.com/title/${imdbId}`} target="_blank" rel="noopener" style={{ color: '#fbbf24', fontWeight: 700, fontSize: '.78rem' }}>IMDb</a>}
            </div>
            {tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                {tags.map((tag: string) => <span key={tag} className={`tag ${getTagClass(tag)}`}>{tag.toUpperCase()}</span>)}
              </div>
            )}
            {genres.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
                {genres.map((g: any) => (
                  <Link key={g.id} href={`/genres?genre=${g.id}&type=tv`} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', padding: '2px 10px', borderRadius: 12, fontSize: '.72rem', color: 'var(--text3)' }}>{g.name}</Link>
                ))}
              </div>
            )}
            {overview && <p style={{ color: 'var(--text2)', lineHeight: 1.7, marginBottom: 20, fontSize: '.9rem' }}>{overview}</p>}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link href={`/watch?id=${tmdbId}&type=tv&s=1&e=1`} className="btn btn-primary"><i className="fas fa-play" /> Watch Now</Link>
              {trailerKey && (
                <button className="btn btn-dark" data-trailer={trailerKey}>
                  <i className="fas fa-film" /> Trailer
                </button>
              )}
              {session && localMedia && (
                <button className="btn btn-dark" id="wl-btn" data-media-id={localMedia.id} data-in={inWatchlist ? '1' : '0'}>
                  <i className={`fas fa-bookmark`} /> {inWatchlist ? 'Watchlisted' : '+ Watchlist'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Seasons */}
        {seasons.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: '.9rem', fontWeight: 700, color: 'var(--text)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="fas fa-layer-group" style={{ color: 'var(--primary)' }} /> Seasons &amp; Episodes
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {seasons.map((s: any) => (
                <Link key={s.season_number} href={`/watch?id=${tmdbId}&type=tv&s=${s.season_number}&e=1`}
                  style={{ padding: '8px 20px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 20, fontSize: '.82rem', fontWeight: 700, color: 'var(--text2)', transition: 'all .2s' }}
                  className="season-link">
                  <strong>Season {s.season_number}</strong>
                  <span style={{ opacity: .6, marginLeft: 6 }}>({s.episode_count} ep)</span>
                </Link>
              ))}
            </div>
            <style>{`.season-link:hover{background:var(--primary)!important;color:#000!important;border-color:var(--primary)!important}`}</style>
          </div>
        )}

        {/* Downloads */}
        {downloads.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: '.95rem', fontWeight: 700, color: 'var(--text)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="fas fa-download" style={{ color: 'var(--primary)' }} /> Download Links
            </div>
            {downloads.map((dl: any) => {
              const urls = (dl.url || '').split('\n').filter(Boolean)
              return (
                <div key={dl.id} className="dl-item">
                  <div className="dl-head">
                    <div className="dl-head-info">
                      <div className="dl-name">{dl.title}</div>
                      <div className="dl-tags">
                        {dl.season_num ? <span className="tag tag-default">S{dl.season_num}{dl.episode_num ? ` E${dl.episode_num}` : ''}</span> : null}
                        {dl.file_size && <span className="tag" style={{ background: 'var(--primary)', color: '#000' }}>{dl.file_size}</span>}
                        {dl.quality && <span className="tag tag-fhd">{dl.quality}</span>}
                        {dl.hdr && <span className="tag tag-hdr">{dl.hdr}</span>}
                        {dl.format && <span className="tag tag-webl">{dl.format}</span>}
                        {dl.audio && <span className="tag tag-default">{dl.audio}</span>}
                      </div>
                    </div>
                    <i className="fas fa-chevron-down dl-arrow" />
                  </div>
                  <div className="dl-body">
                    <div className="dl-links">
                      {urls.map((url: string, i: number) => (
                        <a key={i} href={url} className="dl-link-btn" target="_blank" rel="nofollow noopener">
                          <span><i className="fas fa-download" style={{ marginRight: 8 }} />Download {urls.length > 1 ? `Link ${i + 1}` : 'Now'}</span>
                          <i className="fas fa-external-link-alt" style={{ fontSize: '.8rem' }} />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Cast */}
        {cast.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: '.9rem', fontWeight: 700, color: 'var(--text)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="fas fa-users" style={{ color: 'var(--primary)' }} /> Cast
            </div>
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
              {cast.map((p: any) => (
                <div key={p.id} style={{ flexShrink: 0, textAlign: 'center', width: 72 }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', margin: '0 auto 6px', border: '2px solid var(--border)' }}>
                    <img src={p.profile_path ? tmdbImg(p.profile_path, 'w185') : '/images/no-poster.jpg'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                  </div>
                  <div style={{ fontSize: '.7rem', fontWeight: 600, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  {p.character && <div style={{ fontSize: '.62rem', color: 'var(--text4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.character}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Similar */}
        {similar.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: '.95rem', fontWeight: 700, color: 'var(--text)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="fas fa-th" style={{ color: 'var(--primary)' }} /> You May Also Like
            </div>
            <div className="cards-grid-lg">
              {similar.map((m: any) => <MediaCard key={m.id} item={{ ...m, _type: 'tv' }} />)}
            </div>
          </div>
        )}
      </div>

      {/* Trailer modal */}
      <div id="trailerModal" className="modal-overlay">
        <div className="modal-inner">
          <button className="modal-close" id="trailerClose"><i className="fas fa-times" /> Close</button>
          <iframe id="trailerFrame" src="" allowFullScreen allow="autoplay;fullscreen" style={{ width: '100%', height: '100%', border: 'none', borderRadius: 8 }} />
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        document.querySelectorAll('.dl-head').forEach(h=>{
          h.addEventListener('click',()=>{
            const b=h.nextElementSibling;b.classList.toggle('open');
            h.querySelector('.dl-arrow').style.transform=b.classList.contains('open')?'rotate(180deg)':'';
          });
        });
        ${trailerKey ? `
        document.querySelectorAll('[data-trailer]').forEach(btn=>{
          btn.addEventListener('click',()=>{
            document.getElementById('trailerFrame').src='https://www.youtube.com/embed/${trailerKey}?autoplay=1';
            document.getElementById('trailerModal').classList.add('open');
          });
        });
        document.getElementById('trailerClose').addEventListener('click',()=>{
          document.getElementById('trailerModal').classList.remove('open');
          document.getElementById('trailerFrame').src='';
        });
        ` : ''}
        // Watchlist
        const wlBtn=document.getElementById('wl-btn');
        if(wlBtn){
          wlBtn.addEventListener('click',async()=>{
            const mid=wlBtn.dataset.mediaId;
            const inWl=wlBtn.dataset.in==='1';
            const res=await fetch('/api/watchlist',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({media_id:parseInt(mid),action:inWl?'remove':'add'})});
            const d=await res.json();
            if(d.ok){wlBtn.dataset.in=inWl?'0':'1';wlBtn.querySelector('span')||wlBtn;wlBtn.innerHTML='<i class="fas fa-bookmark"></i> '+(inWl?'+ Watchlist':'Watchlisted');}
          });
        }
      ` }} />
    </div>
  )
}
