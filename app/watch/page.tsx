import { tmdbFetch, tmdbImg, formatRuntime, getTagClass } from '@/lib/tmdb'
import { supabaseAdmin } from '@/lib/supabase'
import { getAllSettings } from '@/lib/settings'
import TelegramBanner from '@/components/ui/TelegramBanner'
import MediaCard from '@/components/ui/MediaCard'
import Link from 'next/link'

export default async function WatchPage({ searchParams }: { searchParams: any }) {
  const sp = await searchParams
  const tmdbId = parseInt(sp.id || '0')
  const type = sp.type === 'tv' ? 'tv' : 'movie'
  const season = Math.max(1, parseInt(sp.s || '1'))
  const ep = Math.max(1, parseInt(sp.e || '1'))
  const srvId = parseInt(sp.server || '0')

  if (!tmdbId) return <div style={{ padding: 40 }}>Not found.</div>

  const [detail, settings, servers] = await Promise.all([
    tmdbFetch(`/${type}/${tmdbId}`, { append_to_response: 'credits,videos,similar,recommendations,external_ids' }),
    getAllSettings(),
    supabaseAdmin.from('embed_servers').select('*').eq('is_active', true).order('sort_order'),
  ])

  const { data: localMedia } = await supabaseAdmin.from('media')
    .select('*, download_links(*)').eq('tmdb_id', tmdbId).eq('type', type).single()

  const title = type === 'tv' ? (detail.name || '') : (detail.title || '')
  const overview = localMedia?.overview || detail.overview || ''
  const year = (detail.release_date || detail.first_air_date || '').slice(0, 4)
  const rating = parseFloat(detail.vote_average || 0).toFixed(1)
  const poster = (localMedia?.poster_path || detail.poster_path) ? tmdbImg(localMedia?.poster_path || detail.poster_path, 'w500') : '/images/no-poster.jpg'
  const backdrop = detail.backdrop_path ? tmdbImg(detail.backdrop_path, 'w1280') : ''
  const genres = localMedia ? (localMedia.genres || []) : (detail.genres || [])
  const seasonsData = localMedia ? (localMedia.seasons_data || []) : (detail.seasons || []).filter((s: any) => s.season_number > 0)
  const runtime = localMedia?.runtime || detail.runtime || 0
  const customVideoUrl = localMedia?.custom_video_url || ''
  const tags: string[] = localMedia?.tags || []
  const downloads = localMedia?.download_links || []

  // IMDb ID
  let imdbId = detail.external_ids?.imdb_id || detail.imdb_id || ''
  if (!imdbId) {
    const ext = await tmdbFetch(`/${type}/${tmdbId}/external_ids`)
    imdbId = ext.imdb_id || ''
  }

  // Episode list for TV
  let episodeList: any[] = []
  let curEpInfo: any = null
  if (type === 'tv') {
    const seasonDetail = await tmdbFetch(`/tv/${tmdbId}/season/${season}`)
    episodeList = seasonDetail.episodes || []
    curEpInfo = episodeList.find((e: any) => e.episode_number === ep) || null
  }

  // Episode-specific custom video URL
  let epCustomUrl = customVideoUrl
  if (type === 'tv' && localMedia) {
    const { data: epVideo } = await supabaseAdmin.from('episode_videos')
      .select('video_url').eq('media_id', localMedia.id).eq('season_num', season).eq('episode_num', ep).single()
    if (epVideo?.video_url) epCustomUrl = epVideo.video_url
  }

  // Build servers list
  const srvList: any[] = servers.data || []
  if (epCustomUrl) {
    srvList.unshift({ id: 0, name: 'Alpha', is_alpha: true, movie_url: epCustomUrl, tv_url: epCustomUrl })
  }

  const activeSrv = srvList.find(s => s.id === srvId) || srvList[0]

  // Build embed URL
  let embedUrl = ''
  let missingImdb = false
  if (activeSrv) {
    if (activeSrv.is_alpha && epCustomUrl) {
      embedUrl = epCustomUrl
    } else {
      let tpl = type === 'tv' ? (activeSrv.tv_url || activeSrv.movie_url || '') : (activeSrv.movie_url || '')
      embedUrl = tpl
        .replace('{imdb_id}', imdbId)
        .replace('{tmdb_id}', String(tmdbId))
        .replace('{season}', String(season))
        .replace('{episode}', String(ep))
      if (tpl.includes('{imdb_id}') && !imdbId) missingImdb = true
    }
  }

  const similar = [...(detail.recommendations?.results || []), ...(detail.similar?.results || [])].slice(0, 12)
  const cast = (detail.credits?.cast || []).slice(0, 10)
  const trailerKey = detail.videos?.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube')?.key

  return (
    <div style={{ paddingTop: 'var(--header-h)', background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Player */}
      <div style={{ background: '#000', width: '100%' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', background: '#000' }}>
            {missingImdb ? (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14, padding: 24, textAlign: 'center' }}>
                <i className="fas fa-exclamation-triangle" style={{ fontSize: '2.5rem', color: '#f59e0b' }} />
                <p style={{ fontSize: '1rem', color: '#fff', fontWeight: 700, margin: 0 }}>IMDb ID Missing</p>
                <p style={{ fontSize: '.82rem', color: '#94a3b8', margin: 0 }}>
                  The <strong style={{ color: '#fff' }}>{activeSrv?.name}</strong> server needs an IMDb ID.
                  {localMedia && <Link href={`/admin/edit-media?id=${localMedia.id}`} style={{ color: 'var(--primary)', marginLeft: 6 }}>Edit this title</Link>}
                </p>
              </div>
            ) : embedUrl ? (
              <iframe src={embedUrl} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                allowFullScreen allow="autoplay;fullscreen;picture-in-picture" referrerPolicy="no-referrer" />
            ) : (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: '#94a3b8' }}>
                <i className="fas fa-exclamation-circle" style={{ fontSize: '2.5rem', color: 'var(--primary)' }} />
                <p style={{ margin: 0 }}>No server configured. <Link href="/admin/embed-servers" style={{ color: 'var(--primary)' }}>Setup servers</Link></p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Server selector */}
      <div style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '14px 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
            <span style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--text4)', letterSpacing: 1, textTransform: 'uppercase', flexShrink: 0 }}>Server</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {srvList.map(s => {
                const isAct = s.id === (activeSrv?.id ?? 0)
                const isAl = !!s.is_alpha
                return (
                  <Link key={s.id} href={`/watch?id=${tmdbId}&type=${type}&s=${season}&e=${ep}&server=${s.id}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, fontSize: '.82rem', fontWeight: 700, textDecoration: 'none', transition: 'all .2s', border: `1.5px solid ${isAct ? (isAl ? '#d97706' : 'var(--primary)') : 'var(--border)'}`, background: isAct ? (isAl ? '#d97706' : 'var(--primary)') : 'var(--bg3)', color: isAct ? '#000' : 'var(--text2)' }}>
                    <i className={`fas ${isAl ? 'fa-bolt' : 'fa-server'}`} style={{ fontSize: '.7rem' }} />
                    {s.name}
                    {isAct && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#000', flexShrink: 0 }} />}
                  </Link>
                )
              })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--text4)', letterSpacing: 1, textTransform: 'uppercase', flexShrink: 0 }}>Actions</span>
            <Link href={type === 'tv' ? `/series?id=${tmdbId}` : `/movie?id=${tmdbId}`} className="btn btn-outline btn-sm" style={{ fontSize: '.78rem' }}><i className="fas fa-info-circle" /> Details</Link>
            {trailerKey && <button className="btn btn-outline btn-sm" style={{ fontSize: '.78rem' }} data-trailer={trailerKey}><i className="fas fa-film" /> Trailer</button>}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 16px' }}>
        {/* Show info */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 22, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
          <img src={poster} style={{ width: 72, minWidth: 72, borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,.5)' }} alt="" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.3rem,3vw,1.9rem)', letterSpacing: 1, color: 'var(--text)', marginBottom: 6, lineHeight: 1 }}>
              {title}
              {type === 'tv' && <span style={{ fontSize: '.85rem', fontFamily: 'var(--font)', fontWeight: 400, color: 'var(--primary)', marginLeft: 8 }}>S{season} E{ep}</span>}
            </h2>
            {curEpInfo && <div style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--text2)', marginBottom: 4 }}>{curEpInfo.name}</div>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '.82rem', color: 'var(--text3)', flexWrap: 'wrap', marginBottom: 8 }}>
              {year && <span><i className="fas fa-calendar" style={{ color: 'var(--primary)', marginRight: 4 }} />{year}</span>}
              {parseFloat(rating) > 0 && <span><i className="fas fa-star" style={{ color: '#fbbf24', marginRight: 4 }} />{rating}/10</span>}
              {runtime > 0 && <span><i className="fas fa-clock" style={{ color: 'var(--primary)', marginRight: 4 }} />{formatRuntime(runtime)}</span>}
              <span style={{ background: 'var(--primary)', color: '#000', padding: '2px 9px', borderRadius: 4, fontSize: '.68rem', fontWeight: 700 }}>{type === 'tv' ? 'SERIES' : 'MOVIE'}</span>
            </div>
            {tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                {tags.map((t: string) => <span key={t} className={`tag ${getTagClass(t)}`}>{t.toUpperCase()}</span>)}
              </div>
            )}
            {genres.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
                {genres.slice(0, 4).map((g: any) => (
                  <span key={g.id || g.name} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', padding: '2px 10px', borderRadius: 12, fontSize: '.72rem', color: 'var(--text3)' }}>{g.name}</span>
                ))}
              </div>
            )}
            {overview && <p style={{ fontSize: '.82rem', color: 'var(--text3)', lineHeight: 1.65, marginTop: 10, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{overview}</p>}
          </div>
        </div>

        <TelegramBanner link={settings.social_telegram || ''} />

        {/* Seasons + Episodes */}
        {type === 'tv' && seasonsData.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: '.9rem', fontWeight: 700, color: 'var(--text)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
              <i className="fas fa-layer-group" style={{ color: 'var(--primary)' }} /> Seasons &amp; Episodes
            </div>
            <div className="season-tabs">
              {seasonsData.map((sea: any) => {
                const sn = sea.season_number
                return (
                  <Link key={sn} href={`/watch?id=${tmdbId}&type=tv&s=${sn}&e=1&server=${activeSrv?.id || 0}`}
                    style={{ padding: '6px 18px', borderRadius: 20, fontSize: '.82rem', fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap', transition: 'all .2s', flexShrink: 0, ...(sn === season ? { background: 'var(--primary)', color: '#000', border: '1px solid var(--primary)' } : { background: 'var(--bg3)', color: 'var(--text3)', border: '1px solid var(--border)' }) }}>
                    Season {sn} <span style={{ fontSize: '.7rem', opacity: .7 }}>({sea.episode_count || 0} ep)</span>
                  </Link>
                )
              })}
            </div>
            {episodeList.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 420, overflowY: 'auto', paddingRight: 4 }} className="ep-list-scroll">
                {episodeList.map((epData: any) => {
                  const epNum = epData.episode_number
                  const epName = epData.name || ''
                  const epStill = epData.still_path ? tmdbImg(epData.still_path, 'w300') : ''
                  const epDesc = epData.overview || ''
                  const epRt = epData.runtime || 0
                  const isActive = epNum === ep
                  const epUrl = `/watch?id=${tmdbId}&type=tv&s=${season}&e=${epNum}&server=${activeSrv?.id || 0}`
                  return (
                    <Link key={epNum} href={epUrl} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: 10, borderRadius: 10, textDecoration: 'none', transition: 'background .2s', background: isActive ? 'rgba(249,115,22,.1)' : 'transparent', border: `1px solid ${isActive ? 'var(--primary)' : 'transparent'}` }}>
                      <div style={{ flexShrink: 0, position: 'relative', width: 120, minWidth: 120 }}>
                        {epStill ? (
                          <img src={epStill} style={{ width: 120, height: 68, objectFit: 'cover', borderRadius: 7, display: 'block' }} loading="lazy" alt="" />
                        ) : (
                          <div style={{ width: 120, height: 68, background: 'var(--bg4)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="fas fa-play" style={{ color: 'var(--text4)' }} />
                          </div>
                        )}
                        {isActive && (
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.5)', borderRadius: 7 }}>
                            <div style={{ width: 30, height: 30, background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <i className="fas fa-play" style={{ color: '#000', fontSize: '.7rem', marginLeft: 2 }} />
                            </div>
                          </div>
                        )}
                        {epRt > 0 && <div style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,.8)', color: '#fff', fontSize: '.65rem', padding: '1px 5px', borderRadius: 3 }}>{epRt}m</div>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                          <span style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--primary)' }}>EP {epNum}</span>
                          {isActive && <span style={{ fontSize: '.65rem', background: 'var(--primary)', color: '#000', padding: '1px 6px', borderRadius: 3, fontWeight: 700 }}>PLAYING</span>}
                        </div>
                        <div style={{ fontSize: '.85rem', fontWeight: 600, color: isActive ? 'var(--primary)' : 'var(--text)', lineHeight: 1.3, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{epName}</div>
                        {epDesc && <div style={{ fontSize: '.75rem', color: 'var(--text4)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{epDesc}</div>}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Downloads */}
        {downloads.length > 0 && (
          <div style={{ marginBottom: 20 }}>
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
          <div style={{ marginBottom: 20 }}>
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
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: '.95rem', fontWeight: 700, color: 'var(--text)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="fas fa-th" style={{ color: 'var(--primary)' }} /> You May Also Like
            </div>
            <div className="cards-grid-lg">
              {similar.map((m: any) => <MediaCard key={m.id} item={{ ...m, _type: type }} />)}
            </div>
          </div>
        )}
      </div>

      {/* Trailer modal + DL accordion - client script */}
      <div id="trailerModal" className="modal-overlay">
        <div className="modal-inner">
          <button className="modal-close" id="trailerClose"><i className="fas fa-times" /> Close</button>
          <iframe id="trailerFrame" src="" allowFullScreen allow="autoplay;fullscreen" style={{ width: '100%', height: '100%', border: 'none', borderRadius: 8 }} />
        </div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: `
        // DL accordion
        document.querySelectorAll('.dl-head').forEach(h=>{
          h.addEventListener('click',()=>{
            const b=h.nextElementSibling;
            b.classList.toggle('open');
            h.querySelector('.dl-arrow').style.transform=b.classList.contains('open')?'rotate(180deg)':'';
          });
        });
        // Trailer
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
      ` }} />
    </div>
  )
}
