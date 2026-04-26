export default function TelegramBanner({ link }: { link: string }) {
  if (!link) return null
  return (
    <div style={{ padding: '16px 0 4px' }}>
      <a href={link} target="_blank" rel="noopener" className="tg-banner">
        <div className="tg-banner-icon"><i className="fab fa-telegram" style={{ fontSize: '1.2rem', color: '#fff' }} /></div>
        <div className="tg-banner-text">
          <strong>Join Our Telegram Channel</strong>
          <span>Latest movies &amp; shows, downloads &amp; notifications</span>
        </div>
        <i className="fas fa-chevron-right tg-banner-arrow" />
      </a>
    </div>
  )
}
