-- 4kHDHub - Supabase PostgreSQL Schema
-- Run this in Supabase SQL Editor

-- Settings
CREATE TABLE IF NOT EXISTS settings (
  id BIGSERIAL PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(10) NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Media (movies + TV)
CREATE TABLE IF NOT EXISTS media (
  id BIGSERIAL PRIMARY KEY,
  tmdb_id INTEGER NOT NULL,
  type VARCHAR(5) NOT NULL CHECK (type IN ('movie','tv')),
  title VARCHAR(300) NOT NULL,
  slug VARCHAR(350) NOT NULL UNIQUE,
  tagline VARCHAR(500),
  overview TEXT,
  poster_path VARCHAR(255),
  backdrop_path VARCHAR(255),
  release_date VARCHAR(20),
  year VARCHAR(4),
  runtime INTEGER,
  vote_average DECIMAL(3,1),
  genres JSONB DEFAULT '[]',
  cast_data JSONB DEFAULT '[]',
  director VARCHAR(255),
  trailer_key VARCHAR(100),
  seasons_count INTEGER,
  episodes_count INTEGER,
  seasons_data JSONB DEFAULT '[]',
  language VARCHAR(20) DEFAULT 'en',
  status VARCHAR(10) NOT NULL DEFAULT 'published' CHECK (status IN ('published','draft')),
  featured BOOLEAN NOT NULL DEFAULT false,
  tags JSONB DEFAULT '[]',
  audio_languages VARCHAR(500),
  imdb_id VARCHAR(20),
  custom_video_url VARCHAR(1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tmdb_id, type)
);

CREATE INDEX IF NOT EXISTS media_type_idx ON media(type);
CREATE INDEX IF NOT EXISTS media_status_idx ON media(status);
CREATE INDEX IF NOT EXISTS media_featured_idx ON media(featured);

-- Download Links
CREATE TABLE IF NOT EXISTS download_links (
  id BIGSERIAL PRIMARY KEY,
  media_id BIGINT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  title VARCHAR(300) NOT NULL,
  quality VARCHAR(50),
  format VARCHAR(100),
  codec VARCHAR(50),
  hdr VARCHAR(50),
  file_size VARCHAR(30),
  audio VARCHAR(300),
  url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  season_num INTEGER,
  episode_num INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS dl_media_idx ON download_links(media_id);

-- Embed Servers
CREATE TABLE IF NOT EXISTS embed_servers (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  movie_url VARCHAR(500),
  tv_url VARCHAR(500),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  use_imdb_id BOOLEAN NOT NULL DEFAULT false
);

-- Episode Custom Videos
CREATE TABLE IF NOT EXISTS episode_videos (
  id BIGSERIAL PRIMARY KEY,
  media_id BIGINT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  season_num INTEGER NOT NULL DEFAULT 1,
  episode_num INTEGER NOT NULL DEFAULT 1,
  video_url VARCHAR(1000) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(media_id, season_num, episode_num)
);

CREATE INDEX IF NOT EXISTS ev_media_idx ON episode_videos(media_id);

-- Watchlist
CREATE TABLE IF NOT EXISTS watchlist (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_id BIGINT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, media_id)
);

-- Default settings
INSERT INTO settings (setting_key, setting_value) VALUES
  ('site_name',         '4kHDHub'),
  ('site_tagline',      ''),
  ('primary_color',     '#f97316'),
  ('items_per_page',    '20'),
  ('homepage_count',    '20'),
  ('allow_registration','1'),
  ('maintenance_mode',  '0'),
  ('show_hero_slider',  '1'),
  ('social_telegram',   ''),
  ('social_twitter',    ''),
  ('social_instagram',  ''),
  ('social_youtube',    ''),
  ('social_facebook',   ''),
  ('tmdb_api_key',      '')
ON CONFLICT (setting_key) DO NOTHING;

-- Default embed servers
INSERT INTO embed_servers (name, movie_url, tv_url, is_active, sort_order) VALUES
  ('VidSrc', 'https://vidsrc.to/embed/movie/{tmdb_id}', 'https://vidsrc.to/embed/tv/{tmdb_id}/{season}/{episode}', true, 1),
  ('2Embed', 'https://www.2embed.cc/embed/{imdb_id}',   'https://www.2embed.cc/embedtv/{imdb_id}&s={season}&e={episode}', true, 2)
ON CONFLICT DO NOTHING;

-- Row Level Security (keep data private — service role bypasses)
ALTER TABLE settings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE media          ENABLE ROW LEVEL SECURITY;
ALTER TABLE download_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE embed_servers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE episode_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist      ENABLE ROW LEVEL SECURITY;

-- Public read for published media (frontend uses service role anyway but good practice)
CREATE POLICY "public read media" ON media FOR SELECT USING (status = 'published');
CREATE POLICY "public read servers" ON embed_servers FOR SELECT USING (is_active = true);
CREATE POLICY "public read downloads" ON download_links FOR SELECT USING (true);
CREATE POLICY "public read ep videos" ON episode_videos FOR SELECT USING (true);
