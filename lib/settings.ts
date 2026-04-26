import { supabaseAdmin } from './supabase'

let settingsCache: Record<string, string> = {}
let cacheTime = 0

export async function getSetting(key: string, defaultVal = ''): Promise<string> {
  // Cache settings for 60s
  if (Date.now() - cacheTime > 60000) {
    const { data } = await supabaseAdmin.from('settings').select('setting_key, setting_value')
    if (data) {
      settingsCache = Object.fromEntries(data.map((r: any) => [r.setting_key, r.setting_value]))
      cacheTime = Date.now()
    }
  }
  return settingsCache[key] ?? defaultVal
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const { data } = await supabaseAdmin.from('settings').select('setting_key, setting_value')
  if (!data) return {}
  return Object.fromEntries(data.map((r: any) => [r.setting_key, r.setting_value]))
}

export async function setSetting(key: string, value: string) {
  await supabaseAdmin.from('settings').upsert(
    { setting_key: key, setting_value: value },
    { onConflict: 'setting_key' }
  )
  settingsCache[key] = value
}

export const DEFAULTS: Record<string, string> = {
  site_name: '4kHDHub',
  site_tagline: '',
  primary_color: '#f97316',
  items_per_page: '20',
  homepage_count: '20',
  allow_registration: '1',
  maintenance_mode: '0',
  show_hero_slider: '1',
  social_telegram: '',
  social_twitter: '',
  social_instagram: '',
  social_youtube: '',
  social_facebook: '',
}
