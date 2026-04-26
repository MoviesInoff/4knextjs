import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const endpoint = searchParams.get('endpoint')
  if (!endpoint) return NextResponse.json({ error: 'no endpoint' }, { status: 400 })

  const apiKey = process.env.TMDB_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'no key' }, { status: 500 })

  // Build params - forward everything except 'endpoint'
  const params = new URLSearchParams({ api_key: apiKey, language: 'en-US' })
  searchParams.forEach((v, k) => {
    if (k !== 'endpoint') params.set(k, v)
  })

  const url = `https://api.themoviedb.org/3${endpoint}?${params}`

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': '4kHDHub/1.0' },
      cf: { cacheTtl: 3600, cacheEverything: true } as any,
    })
    const data = await res.json()
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (e) {
    return NextResponse.json({ results: [] }, { status: 500 })
  }
}
