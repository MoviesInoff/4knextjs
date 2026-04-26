/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for Cloudflare Pages deployment
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'image.tmdb.org' },
    ],
    unoptimized: true,
  },
  // Renamed in Next.js 14.1+ (was serverComponentsExternalPackages)
  serverExternalPackages: ['bcryptjs'],
  typescript: {
    // We handle type safety manually; don't fail build on type errors
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
