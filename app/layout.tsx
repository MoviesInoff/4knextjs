import type { Metadata } from 'next'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: '4kHDHub',
  description: 'Stream and download movies, series, anime in HD and 4K',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
