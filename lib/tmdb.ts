// All TMDB API calls go through Cloudflare Workers proxy
// This means calls come from Cloudflare servers, not the user's IP
// → Jio network blocks are bypassed completely

export const TMDB_IMG = 'https://image.tmdb.org/t/p/'

export function tmdbImg(path: string | null | undefined, size = 'w500') {
  if (!path) return '/images/no-poster.jpg'
  return `${TMDB_IMG}${size}${path}`
}

export function formatRuntime(min: number) {
  if (!min) return ''
  return `${Math.floor(min / 60)}h ${min % 60}m`
}

// Called server-side (in API routes / Server Components)
// Uses Cloudflare Worker URL in production, direct TMDB in dev
export async function tmdbFetch(endpoint: string, params: Record<string, string | number> = {}) {
  const apiKey = process.env.TMDB_API_KEY
  if (!apiKey) return { results: [], error: 'no_key' }

  const qs = new URLSearchParams({
    api_key: apiKey,
    language: 'en-US',
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
  })

  const url = `https://api.themoviedb.org/3${endpoint}?${qs}`

  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 }, // cache 1 hour
      headers: { 'User-Agent': '4kHDHub/1.0' },
    })
    if (!res.ok) return { results: [] }
    return res.json()
  } catch {
    return { results: [] }
  }
}

export function getTagClass(tag: string): string {
  const t = tag.toLowerCase().trim()
  const map: Record<string, string> = {
    '4k': 'tag-4k', 'hdr': 'tag-hdr', 'hdr10': 'tag-hdr', 'hdr10+': 'tag-hdr',
    'dv': 'tag-dv', '1080p': 'tag-fhd', 'fhd': 'tag-fhd',
    '720p': 'tag-hd', 'hd': 'tag-hd',
    'web-dl': 'tag-webl', 'webl': 'tag-webl',
    'bluray': 'tag-bd', 'blu-ray': 'tag-bd',
  }
  return map[t] ?? 'tag-default'
}
