import { getSession } from '@/lib/auth'
import { getAllSettings } from '@/lib/settings'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [user, settings] = await Promise.all([getSession(), getAllSettings()])
  const pc = settings.primary_color || '#f97316'

  return (
    <>
      <style>{`:root{--primary:${pc};--primary-dark:${adjustColor(pc,-20)};--primary-glow:${hexToRgba(pc,0.25)}}`}</style>
      <Header user={user} siteName={settings.site_name || '4kHDHub'} primaryColor={pc} />
      <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
      <Footer settings={settings} isLoggedIn={!!user} />
    </>
  )
}

function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16)
  return `rgba(${r},${g},${b},${alpha})`
}
function adjustColor(hex: string, amt: number) {
  const h = hex.replace('#','')
  const r = Math.max(0,Math.min(255,parseInt(h.slice(0,2),16)+amt))
  const g = Math.max(0,Math.min(255,parseInt(h.slice(2,4),16)+amt))
  const b = Math.max(0,Math.min(255,parseInt(h.slice(4,6),16)+amt))
  return '#'+[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('')
}
