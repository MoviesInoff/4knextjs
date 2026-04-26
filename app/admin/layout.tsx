import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getAllSettings } from '@/lib/settings'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession()
  if (!user || user.role !== 'admin') redirect('/login')

  const settings = await getAllSettings()
  const sn = settings.site_name || '4kHDHub'
  const pc = settings.primary_color || '#f97316'

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: 'tachometer-alt', section: 'main' },
    { href: '/admin/import', label: 'Import from TMDB', icon: 'cloud-download-alt', section: 'content' },
    { href: '/admin/media-list', label: 'All Media', icon: 'film', section: 'content' },
    { href: '/admin/embed-servers', label: 'Embed Servers', icon: 'server', section: 'settings' },
    { href: '/admin/api-settings', label: 'API Settings', icon: 'key', section: 'settings' },
    { href: '/admin/settings', label: 'Site Settings', icon: 'cog', section: 'settings' },
    { href: '/admin/users', label: 'Users', icon: 'users', section: 'settings' },
    { href: '/', label: 'View Site', icon: 'external-link-alt', section: 'site' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0a' }}>
      <style>{`
        :root{--primary:${pc}}
        .c-bg{background:#111}.c-bg2{background:#161616}.c-bg3{background:#1a1a1a}
        .c-bg4{background:#1e1e1e}.c-bg5{background:#222}
        .c-border{border-color:rgba(255,255,255,.07)}
        .c-text{color:#f0f0f0}.c-text2{color:#aaa}.c-text3{color:#666}.c-text4{color:#444}
        .c-primary{color:${pc}}.c-green{color:#22c55e}.c-yellow{color:#fbbf24}.c-red{color:#ef4444}.c-blue{color:#3b82f6}
        body{font-family:'Inter',sans-serif}
      `}</style>

      {/* Sidebar */}
      <aside style={{ width: 220, background: '#111', borderRight: '1px solid rgba(255,255,255,.06)', padding: '20px 0', flexShrink: 0, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
        <div style={{ padding: '0 16px 20px', borderBottom: '1px solid rgba(255,255,255,.06)', marginBottom: 16 }}>
          <Link href="/admin" style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.6rem', letterSpacing: 2, textDecoration: 'none', display: 'block' }}>
            <span style={{ color: pc }}>{sn.slice(0,2).toUpperCase()}</span>
            <span style={{ color: '#f0f0f0' }}>{sn.slice(2).toUpperCase()}</span>
          </Link>
          <div style={{ fontSize: '.65rem', color: '#444', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 }}>Admin</div>
        </div>

        {(['main','content','settings','site'] as const).map(section => {
          const sectionItems = navItems.filter(n => n.section === section)
          const labels: Record<string, string> = { main: 'Main', content: 'Content', settings: 'Settings', site: 'Site' }
          return (
            <div key={section} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: '.62rem', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#333', padding: '6px 20px 4px' }}>{labels[section]}</div>
              {sectionItems.map(item => (
                <Link key={item.href} href={item.href}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 20px', color: '#888', fontSize: '.82rem', fontWeight: 500, textDecoration: 'none', transition: 'all .15s' }}
                  className="admin-nav-link">
                  <i className={`fas fa-${item.icon}`} style={{ width: 16, fontSize: '.8rem', opacity: .7 }} />
                  {item.label}
                </Link>
              ))}
            </div>
          )
        })}
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{ background: '#111', borderBottom: '1px solid rgba(255,255,255,.06)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#f0f0f0', fontWeight: 700, fontSize: '.9rem' }}>Admin Panel</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '.78rem', color: '#555' }}>{user.username}</span>
            <LogoutBtn />
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {children}
        </div>
      </div>

      <style>{`
        .admin-nav-link:hover{background:rgba(255,255,255,.04);color:#ccc!important}
        a[href="${''}"].admin-nav-link{background:rgba(249,115,22,.1);color:${pc}!important}
      `}</style>
    </div>
  )
}

function LogoutBtn() {
  return (
    <form action="/api/auth/logout" method="POST">
      <button type="submit" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,.1)', borderRadius: 6, padding: '5px 12px', color: '#666', fontSize: '.75rem', cursor: 'pointer' }}>
        <i className="fas fa-sign-out-alt" style={{ marginRight: 5 }} />Sign Out
      </button>
    </form>
  )
}
