# 4kHDHub — Next.js + Supabase + Cloudflare Pages

## Stack
- **Frontend**: Next.js 14 (App Router) → Cloudflare Pages
- **Backend**: API Routes → Cloudflare Edge Workers
- **Database**: Supabase (PostgreSQL)
- **Auth**: JWT via jose + bcryptjs (httpOnly cookies)
- **TMDB Proxy**: CF Workers → Jio bypass ✓

---

## Step 1 — Supabase Setup

1. [supabase.com](https://supabase.com) → New Project
2. SQL Editor → run entire `supabase-schema.sql`
3. Settings → API → copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

## Step 2 — Create Admin User

Run in Supabase SQL Editor (hash password at bcrypt-generator.com, rounds=10):

```sql
INSERT INTO users (username, email, password, role, is_active)
VALUES ('admin', 'your@email.com', '$2b$10$YOUR_HASH', 'admin', true);
```

## Step 3 — TMDB API Key

themoviedb.org/settings/api → free v3 key → add as `TMDB_API_KEY`

## Step 4 — Deploy to Cloudflare Pages

1. Push to GitHub
2. Cloudflare Dashboard → Pages → Create Project → Connect GitHub
3. Build settings:
   - Framework: Next.js
   - Build command: `npm run build`
   - Output: `.next`
4. Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL      = https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...
SUPABASE_SERVICE_ROLE_KEY     = eyJ...
TMDB_API_KEY                  = your_tmdb_key
JWT_SECRET                    = random-32-char-string
NEXT_PUBLIC_SITE_URL          = https://your-site.pages.dev
```

5. Save and Deploy

## Step 5 — First Login

1. Visit `/login` → sign in as admin
2. `/admin/api-settings` → enter TMDB key
3. `/admin/import` → import movies/series
4. `/admin/embed-servers` → add embed server URLs

## Jio Fix — How It Works

```
User (Jio) → Cloudflare Pages → /api/tmdb (CF Worker) → TMDB API
```

TMDB is called from Cloudflare's servers, not the user's IP.
Jio cannot block Cloudflare infrastructure.

## Supabase Free Tier — Stay Active

Add a free cron at cron-job.org pinging `/api/health` every 3 days.
Create `app/api/health/route.ts`:
```ts
export async function GET() { return new Response('ok') }
```

## All Routes

| Route | Page |
|-------|------|
| `/` | Homepage (anime) |
| `/movies` | Browse movies |
| `/series` | Browse TV |
| `/anime` | Anime only |
| `/genres` | Genre browser |
| `/movie?id=X` | Movie detail |
| `/series/detail?id=X` | Series detail |
| `/watch?id=X&type=movie` | Watch movie |
| `/watch?id=X&type=tv&s=1&e=1` | Watch episode |
| `/search?q=X` | Search |
| `/watchlist` | My watchlist |
| `/admin` | Dashboard |
| `/admin/import` | Import from TMDB |
| `/admin/media-list` | All media |
| `/admin/edit-media?id=X` | Edit + downloads + episode videos |
| `/admin/embed-servers` | Embed servers |
| `/admin/settings` | Site settings |
| `/admin/api-settings` | API key |
| `/admin/users` | Users |
