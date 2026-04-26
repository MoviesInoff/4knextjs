import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { tmdbFetch } from '@/lib/tmdb'
import { setSetting } from '@/lib/settings'

function makeSlug(title: string, year: string, type: string) {
  let slug = title.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .trim()
  if (year) slug += '-' + year
  slug += '-' + (type === 'tv' ? 'series' : 'movie')
  return slug
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { action } = body

  // ── IMPORT MEDIA ─────────────────────────────────────────────────
  if (action === 'import_media') {
    const { tmdb_id, media_type } = body
    const type = media_type === 'tv' ? 'tv' : 'movie'

    const { data: existing } = await supabaseAdmin
      .from('media').select('id').eq('tmdb_id', tmdb_id).eq('type', type).single()
    if (existing) return NextResponse.json({ error: 'already_imported', id: existing.id })

    const detail = await tmdbFetch(`/${type === 'tv' ? 'tv' : 'movie'}/${tmdb_id}`, {
      append_to_response: 'credits,videos,external_ids'
    })
    if (!detail?.id) return NextResponse.json({ error: 'tmdb_fetch_failed' }, { status: 400 })

    const title = detail.title || detail.name || ''
    const year = (detail.release_date || detail.first_air_date || '').slice(0, 4)
    const cast = (detail.credits?.cast || []).slice(0, 15).map((c: any) => ({
      name: c.name, character: c.character || '', profile_path: c.profile_path || ''
    }))
    const director = detail.credits?.crew?.find((c: any) => c.job === 'Director')?.name || ''
    const trailer = detail.videos?.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube')?.key || null
    const seasonsData = type === 'tv'
      ? (detail.seasons || []).filter((s: any) => s.season_number > 0).map((s: any) => ({
          season_number: s.season_number, episode_count: s.episode_count || 0, name: s.name || ''
        }))
      : []
    const imdbId = detail.imdb_id || detail.external_ids?.imdb_id || ''
    const slug = makeSlug(title, year, type)

    const { data: newMedia, error } = await supabaseAdmin.from('media').insert({
      tmdb_id, type, title, slug,
      tagline: detail.tagline || '',
      overview: detail.overview || '',
      poster_path: detail.poster_path || '',
      backdrop_path: detail.backdrop_path || '',
      release_date: detail.release_date || detail.first_air_date || '',
      year, runtime: detail.runtime || null,
      vote_average: detail.vote_average || 0,
      genres: detail.genres || [],
      cast_data: cast, director, trailer_key: trailer,
      seasons_count: detail.number_of_seasons || null,
      episodes_count: detail.number_of_episodes || null,
      seasons_data: seasonsData, imdb_id: imdbId, status: 'published'
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, id: newMedia.id, title })
  }

  // ── SAVE MEDIA META ───────────────────────────────────────────────
  if (action === 'save_media') {
    const { id, title, tagline, overview, year, runtime, vote_average,
            director, audio_languages, status, featured, imdb_id, tags, custom_video_url } = body
    const { error } = await supabaseAdmin.from('media').update({
      title, tagline, overview, year,
      runtime: runtime ? parseInt(runtime) : null,
      vote_average: parseFloat(vote_average) || 0,
      director, audio_languages,
      status: status === 'draft' ? 'draft' : 'published',
      featured: !!featured, imdb_id,
      tags: Array.isArray(tags) ? tags : (tags || '').split(',').map((t: string) => t.trim()).filter(Boolean),
      custom_video_url: custom_video_url || null,
      updated_at: new Date().toISOString()
    }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // ── DELETE MEDIA ──────────────────────────────────────────────────
  if (action === 'delete_media') {
    const { id } = body
    await supabaseAdmin.from('download_links').delete().eq('media_id', id)
    await supabaseAdmin.from('episode_videos').delete().eq('media_id', id)
    await supabaseAdmin.from('watchlist').delete().eq('media_id', id)
    await supabaseAdmin.from('media').delete().eq('id', id)
    return NextResponse.json({ ok: true })
  }

  // ── DOWNLOAD LINKS ────────────────────────────────────────────────
  if (action === 'add_download') {
    const { media_id, title: t, quality, format, codec, hdr, file_size, audio, url, sort_order, season_num, episode_num } = body
    const { data, error } = await supabaseAdmin.from('download_links').insert({
      media_id, title: t, quality, format, codec, hdr, file_size, audio, url,
      sort_order: sort_order || 0,
      season_num: season_num || null,
      episode_num: episode_num || null,
    }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, id: data.id })
  }

  if (action === 'edit_download') {
    const { id, title: t, quality, format, codec, hdr, file_size, audio, url, sort_order, season_num, episode_num } = body
    await supabaseAdmin.from('download_links').update({
      title: t, quality, format, codec, hdr, file_size, audio, url,
      sort_order: sort_order || 0,
      season_num: season_num || null,
      episode_num: episode_num || null,
    }).eq('id', id)
    return NextResponse.json({ ok: true })
  }

  if (action === 'delete_download') {
    await supabaseAdmin.from('download_links').delete().eq('id', body.id)
    return NextResponse.json({ ok: true })
  }

  // ── EPISODE VIDEOS ────────────────────────────────────────────────
  if (action === 'save_episode_video') {
    const { media_id, season_num, episode_num, video_url } = body
    if (!video_url) {
      await supabaseAdmin.from('episode_videos').delete()
        .eq('media_id', media_id).eq('season_num', season_num).eq('episode_num', episode_num)
    } else {
      await supabaseAdmin.from('episode_videos').upsert(
        { media_id, season_num, episode_num, video_url, updated_at: new Date().toISOString() },
        { onConflict: 'media_id,season_num,episode_num' }
      )
    }
    return NextResponse.json({ ok: true })
  }

  if (action === 'delete_episode_video') {
    await supabaseAdmin.from('episode_videos').delete().eq('id', body.id)
    return NextResponse.json({ ok: true })
  }

  // ── EMBED SERVERS ─────────────────────────────────────────────────
  if (action === 'add_server') {
    const { name, movie_url, tv_url, is_active, sort_order, use_imdb_id } = body
    const { data, error } = await supabaseAdmin.from('embed_servers').insert({
      name, movie_url, tv_url,
      is_active: !!is_active, sort_order: sort_order || 0, use_imdb_id: !!use_imdb_id
    }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, id: data.id })
  }

  if (action === 'edit_server') {
    const { id, name, movie_url, tv_url, is_active, sort_order, use_imdb_id } = body
    await supabaseAdmin.from('embed_servers').update({
      name, movie_url, tv_url,
      is_active: !!is_active, sort_order: sort_order || 0, use_imdb_id: !!use_imdb_id
    }).eq('id', id)
    return NextResponse.json({ ok: true })
  }

  if (action === 'toggle_server') {
    const { data } = await supabaseAdmin.from('embed_servers').select('is_active').eq('id', body.id).single()
    await supabaseAdmin.from('embed_servers').update({ is_active: !data?.is_active }).eq('id', body.id)
    return NextResponse.json({ ok: true })
  }

  if (action === 'delete_server') {
    await supabaseAdmin.from('embed_servers').delete().eq('id', body.id)
    return NextResponse.json({ ok: true })
  }

  // ── SETTINGS ──────────────────────────────────────────────────────
  if (action === 'save_settings') {
    const { settings } = body
    for (const [key, val] of Object.entries(settings)) {
      await setSetting(key, String(val))
    }
    return NextResponse.json({ ok: true })
  }

  // ── USERS ─────────────────────────────────────────────────────────
  if (action === 'toggle_user') {
    const { data } = await supabaseAdmin.from('users').select('is_active').eq('id', body.id).single()
    await supabaseAdmin.from('users').update({ is_active: !data?.is_active }).eq('id', body.id)
    return NextResponse.json({ ok: true })
  }

  if (action === 'change_role') {
    await supabaseAdmin.from('users').update({ role: body.role }).eq('id', body.id)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
