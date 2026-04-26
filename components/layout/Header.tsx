'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { tmdbImg } from '@/lib/tmdb'

type User = { id: string; username: string; email: string; role: string } | null

export default function Header({ user, siteName, primaryColor }: {
  user: User, siteName: string, primaryColor: string
}) {
  const [scrolled, setScrolled] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchVal, setSearchVal] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showDrop, setShowDrop] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const searchTimer = useRef<any>(null)
  const router = useRouter()
  const pathname = usePathname()

  const twoLetter = siteName.slice(0, 2).toUpperCase()
  const rest = siteName.slice(2).toUpperCase()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleSearch = (val: string) => {
    setSearchVal(val)
    clearTimeout(searchTimer.current)
    if (!val.trim()) { setSearchResults([]); setShowDrop(false); return }
    searchTimer.current = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(val)}`)
      const data = await res.json()
      setSearchResults(data.results || [])
      setShowDrop(true)
    }, 300)
  }

  const handleSearchSubmit = (val: string) => {
    if (val.trim()) {
      setShowDrop(false)
      router.push(`/search?q=${encodeURIComponent(val.trim())}`)
    }
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

  const nav = [
    { href: '/', label: 'Home' },
    { href: '/movies', label: 'Movies' },
    { href: '/series', label: 'Web Series' },
    { href: '/anime', label: 'Anime' },
    { href: '/genres', label: 'Genres' },
  ]

  return (
    <>
      {/* Drawer overlay */}
      {drawerOpen && (
        <div className="drawer-overlay show" onClick={() => setDrawerOpen(false)} />
      )}

      {/* Mobile Drawer */}
      <div className={`drawer ${drawerOpen ? 'open' : ''}`}>
        <div className="drawer-head">
          <Link href="/" style={{ fontFamily: 'var(--font-display)', fontSize: '1.85rem', letterSpacing: 2, textDecoration: 'none', color: 'var(--text)' }}>
            <span style={{ color: primaryColor }}>{twoLetter}</span>{rest}
          </Link>
          <button className="btn-icon" onClick={() => setDrawerOpen(false)}>
            <i className="fas fa-times" />
          </button>
        </div>
        {user && (
          <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: 12, marginBottom: 18 }}>
            <div style={{ fontWeight: 700, color: 'var(--text)' }}>{user.username}</div>
            <div style={{ fontSize: '.75rem', color: 'var(--text3)' }}>Member</div>
          </div>
        )}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <i className="fas fa-search" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text4)', fontSize: '.85rem' }} />
          <input className="form-control" placeholder="Search..." style={{ borderRadius: 20, paddingLeft: 34 }}
            onKeyDown={e => { if (e.key === 'Enter') { handleSearchSubmit((e.target as HTMLInputElement).value); setDrawerOpen(false) } }} />
        </div>
        <nav className="drawer-nav">
          {nav.map(n => (
            <Link key={n.href} href={n.href} className={pathname === n.href ? 'active' : ''} onClick={() => setDrawerOpen(false)}>
              <i className={`fas fa-${n.href === '/' ? 'home' : n.href === '/movies' ? 'film' : n.href === '/series' ? 'tv' : n.href === '/anime' ? 'dragon' : 'tags'}`} style={{ width: 20 }} />
              {n.label}
            </Link>
          ))}
          {user ? (
            <>
              <hr style={{ borderColor: 'var(--border)', margin: '10px 0' }} />
              <Link href="/watchlist" onClick={() => setDrawerOpen(false)}><i className="fas fa-bookmark" style={{ width: 20 }} /> My Watchlist</Link>
              {user.role === 'admin' && (
                <Link href="/admin" style={{ color: primaryColor }} onClick={() => setDrawerOpen(false)}><i className="fas fa-cog" style={{ width: 20 }} /> Admin Panel</Link>
              )}
              <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 'var(--radius)', color: 'var(--text2)', fontSize: '.925rem', fontWeight: 500, width: '100%' }}>
                <i className="fas fa-sign-out-alt" style={{ width: 20 }} /> Sign Out
              </button>
            </>
          ) : (
            <>
              <hr style={{ borderColor: 'var(--border)', margin: '10px 0' }} />
              <Link href="/login" onClick={() => setDrawerOpen(false)}><i className="fas fa-sign-in-alt" style={{ width: 20 }} /> Sign In</Link>
              <Link href="/register" style={{ color: primaryColor }} onClick={() => setDrawerOpen(false)}><i className="fas fa-user-plus" style={{ width: 20 }} /> Register Free</Link>
            </>
          )}
        </nav>
      </div>

      {/* Main header */}
      <header className={`header ${scrolled ? 'scrolled' : ''}`}>
        <Link href="/" style={{ fontFamily: 'var(--font-display)', fontSize: '1.85rem', letterSpacing: 2, textDecoration: 'none', color: 'var(--text)', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          <span style={{ color: primaryColor }}>{twoLetter}</span>{rest}
        </Link>

        <nav className="header-nav">
          {nav.map(n => (
            <Link key={n.href} href={n.href} className={pathname === n.href ? 'active' : ''}>{n.label}</Link>
          ))}
        </nav>

        <div className="header-right">
          {/* Desktop search */}
          <div className="search-wrap" style={{ display: 'flex' }}>
            <i className="fas fa-search si" />
            <input
              type="text" placeholder="Search movies, shows..."
              value={searchVal}
              onChange={e => handleSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearchSubmit(searchVal) }}
              onFocus={() => searchResults.length > 0 && setShowDrop(true)}
            />
          </div>

          {user ? (
            <div className="user-dropdown">
              <div className="user-btn" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                {user.username[0].toUpperCase()}
              </div>
              <div className={`user-menu ${userMenuOpen ? 'show' : ''}`}>
                <div className="user-menu-head">
                  <div className="uname">{user.username}</div>
                  <div className="uemail">{user.email}</div>
                </div>
                <Link href="/watchlist" onClick={() => setUserMenuOpen(false)}><i className="fas fa-bookmark" /> My Watchlist</Link>
                {user.role === 'admin' && (
                  <Link href="/admin" style={{ color: primaryColor }} onClick={() => setUserMenuOpen(false)}><i className="fas fa-cog" /> Admin Panel</Link>
                )}
                <button onClick={logout} className="danger"><i className="fas fa-sign-out-alt" /> Sign Out</button>
              </div>
            </div>
          ) : (
            <>
              <Link href="/login" className="btn btn-outline btn-sm">Sign In</Link>
              <Link href="/register" className="btn btn-primary btn-sm" style={{ background: primaryColor }}>Join Free</Link>
            </>
          )}

          <button className="btn-icon" style={{ display: 'none' }} onClick={() => setMobileSearchOpen(!mobileSearchOpen)} id="mobile-search-btn">
            <i className="fas fa-search" />
          </button>
          <button className="hamburger" onClick={() => setDrawerOpen(true)}>
            <span /><span /><span />
          </button>
        </div>
      </header>

      {/* Mobile search bar */}
      {mobileSearchOpen && (
        <div style={{ position: 'fixed', top: 'var(--header-h)', left: 0, right: 0, zIndex: 998, background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '12px 16px' }}>
          <div style={{ position: 'relative', maxWidth: 600, margin: '0 auto' }}>
            <i className="fas fa-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text4)', fontSize: '.85rem' }} />
            <input className="form-control" placeholder="Search movies, shows, anime..."
              style={{ paddingLeft: 36, borderRadius: 20 }} autoFocus
              onKeyDown={e => { if (e.key === 'Enter') { handleSearchSubmit((e.target as HTMLInputElement).value); setMobileSearchOpen(false) } }} />
          </div>
        </div>
      )}

      {/* Search dropdown */}
      {showDrop && searchResults.length > 0 && (
        <div className="search-results-drop show">
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            {searchResults.map((item: any) => {
              const isTV = item._type === 'tv'
              const title = isTV ? item.name : item.title
              const year = (isTV ? item.first_air_date : item.release_date || '').slice(0, 4)
              const poster = item.poster_path ? tmdbImg(item.poster_path, 'w92') : '/images/no-poster.jpg'
              const href = isTV ? `/series?id=${item.id}` : `/movie?id=${item.id}`
              return (
                <Link key={item.id} href={href} className="sr-item" onClick={() => setShowDrop(false)}>
                  <img src={poster} alt="" style={{ width: 42, height: 63, borderRadius: 5, objectFit: 'cover', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '.9rem', color: 'var(--text)' }}>{title}</div>
                    <div style={{ fontSize: '.75rem', color: 'var(--text3)', marginTop: 3 }}>{year} · {isTV ? 'TV' : 'Movie'}</div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      <style>{`
        @media(max-width:768px){#mobile-search-btn{display:flex!important}}
      `}</style>
    </>
  )
}
