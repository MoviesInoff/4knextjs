import Link from 'next/link'

export default function Footer({ settings, isLoggedIn }: {
  settings: Record<string, string>, isLoggedIn: boolean
}) {
  const sn = settings.site_name || '4kHDHub'
  const pc = settings.primary_color || '#f97316'
  const tg = settings.social_telegram || ''
  const tw = settings.social_twitter || ''
  const ig = settings.social_instagram || ''
  const yt = settings.social_youtube || ''
  const fb = settings.social_facebook || ''
  const twoLetter = sn.slice(0, 2).toUpperCase()
  const rest = sn.slice(2).toUpperCase()

  const socialBtn = (href: string, icon: string, bg: string) => (
    <a href={href} target="_blank" rel="noopener"
      style={{ width: 36, height: 36, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '.9rem', textDecoration: 'none', transition: 'opacity .2s' }}
      onMouseOver={e => (e.currentTarget.style.opacity = '.8')}
      onMouseOut={e => (e.currentTarget.style.opacity = '1')}>
      <i className={`fab fa-${icon}`} />
    </a>
  )

  return (
    <footer>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="footer-top-grid">
          {/* Brand */}
          <div>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 0, textDecoration: 'none', marginBottom: 16, fontFamily: 'var(--font-display)', fontSize: '1.85rem', letterSpacing: 2 }}>
              <span style={{ color: pc }}>{twoLetter}</span>
              <span style={{ color: '#f0f0f0' }}>{rest}</span>
            </Link>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
              {tg && socialBtn(tg, 'telegram', '#229ED9')}
              {tw && socialBtn(tw, 'x-twitter', '#000')}
              {ig && socialBtn(ig, 'instagram', 'radial-gradient(circle at 30% 107%,#fdf497 0%,#fd5949 45%,#d6249f 60%,#285AEB 90%)')}
              {yt && socialBtn(yt, 'youtube', '#FF0000')}
              {fb && socialBtn(fb, 'facebook-f', '#1877F2')}
              {!tg && !tw && !ig && !yt && !fb && (
                <Link href="/admin/settings" style={{ width: 36, height: 36, borderRadius: '50%', background: '#229ED9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <i className="fab fa-telegram" />
                </Link>
              )}
            </div>
          </div>

          {/* Browse */}
          <div>
            <div style={{ fontSize: '.75rem', fontWeight: 700, letterSpacing: '.8px', textTransform: 'uppercase', color: '#f0f0f0', marginBottom: 16 }}>Browse</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[['Movies', '/movies'], ['Web Series', '/series'], ['Anime', '/anime'], ['Genres', '/genres']].map(([label, href]) => (
                <Link key={href} href={href} style={{ color: '#555', fontSize: '.85rem', transition: 'color .2s' }}
                  onMouseOver={e => (e.currentTarget.style.color = pc)}
                  onMouseOut={e => (e.currentTarget.style.color = '#555')}>{label}</Link>
              ))}
            </div>
          </div>

          {/* Account */}
          <div>
            <div style={{ fontSize: '.75rem', fontWeight: 700, letterSpacing: '.8px', textTransform: 'uppercase', color: '#f0f0f0', marginBottom: 16 }}>Account</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {isLoggedIn ? (
                <>
                  <Link href="/watchlist" style={{ color: '#555', fontSize: '.85rem' }}>My Watchlist</Link>
                  <Link href="/api/auth/logout" style={{ color: '#555', fontSize: '.85rem' }}>Sign Out</Link>
                </>
              ) : (
                <>
                  <Link href="/login" style={{ color: '#555', fontSize: '.85rem' }}>Sign In</Link>
                  <Link href="/register" style={{ color: '#555', fontSize: '.85rem' }}>Register Free</Link>
                </>
              )}
            </div>
          </div>

          {/* Info */}
          <div>
            <div style={{ fontSize: '.75rem', fontWeight: 700, letterSpacing: '.8px', textTransform: 'uppercase', color: '#f0f0f0', marginBottom: 16 }}>Info</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['About Us', 'DMCA', 'Privacy Policy', 'Contact'].map(label => (
                <a key={label} href="#" style={{ color: '#555', fontSize: '.85rem' }}>{label}</a>
              ))}
            </div>
          </div>
        </div>

        <div style={{ background: '#111', borderRadius: 10, padding: '14px 18px', marginBottom: 24, fontSize: '.78rem', color: '#3a3a3a', lineHeight: 1.6 }}>
          <strong style={{ color: '#444' }}>Disclaimer:</strong> This site does not store any files on its server. All content is provided by non-affiliated third parties. TMDB data used under their API terms.
        </div>

        <div style={{ borderTop: '1px solid #161616', padding: '18px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ color: '#333', fontSize: '.78rem' }}>&copy; {new Date().getFullYear()} {sn} &mdash; All rights reserved.</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.75rem', color: '#2a2a2a' }}>
            <img src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_2-d537fb228cf3ded904ef09b136fe3fec72548ebc1fea3fbbd1ad9e36364db38b.svg" alt="TMDB" style={{ height: 16, opacity: .3 }} />
            <span>Data by TMDB</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
