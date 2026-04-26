import { supabaseAdmin } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { tmdbFetch, tmdbImg } from '@/lib/tmdb'
import EditMediaForm from './EditMediaForm'

export default async function EditMediaPage({ searchParams }: { searchParams: any }) {
  const sp = await searchParams
  const id = parseInt(sp.id || '0')
  if (!id) redirect('/admin/media-list')

  const { data: media } = await supabaseAdmin.from('media').select('*').eq('id', id).single()
  if (!media) redirect('/admin/media-list')

  const { data: downloads } = await supabaseAdmin.from('download_links').select('*').eq('media_id', id).order('sort_order').order('id')
  const { data: episodeVideos } = await supabaseAdmin.from('episode_videos').select('*').eq('media_id', id).order('season_num').order('episode_num')

  // Build episode videos map
  const evMap: Record<string, any> = {}
  for (const ev of episodeVideos || []) {
    evMap[`${ev.season_num}-${ev.episode_num}`] = ev
  }

  // Load seasons/episodes from TMDB if TV
  let seasonsData: any[] = media.seasons_data || []
  if (media.type === 'tv' && seasonsData.length === 0) {
    const td = await tmdbFetch(`/tv/${media.tmdb_id}`)
    seasonsData = (td.seasons || []).filter((s: any) => s.season_number > 0)
  }

  const poster = media.poster_path ? tmdbImg(media.poster_path, 'w500') : '/images/no-poster.jpg'
  const tags = Array.isArray(media.tags) ? media.tags.join(', ') : ''

  return (
    <EditMediaForm
      media={media}
      downloads={downloads || []}
      episodeVideos={evMap}
      seasonsData={seasonsData}
      poster={poster}
      tagsStr={tags}
    />
  )
}
