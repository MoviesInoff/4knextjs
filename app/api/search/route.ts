import { NextRequest, NextResponse } from 'next/server'
import { tmdbFetch } from '@/lib/tmdb'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || ''
  if (!q.trim()) return NextResponse.json({ results: [] })

  const [movies, tv] = await Promise.all([
    tmdbFetch('/search/movie', { query: q, page: 1 }),
    tmdbFetch('/search/tv', { query: q, page: 1 }),
  ])

  const results = [
    ...(movies.results || []).slice(0, 5).map((m: any) => ({ ...m, _type: 'movie' })),
    ...(tv.results || []).slice(0, 5).map((m: any) => ({ ...m, _type: 'tv' })),
  ]
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, 8)

  return NextResponse.json({ results }, {
    headers: { 'Cache-Control': 'public, s-maxage=300' }
  })
}
