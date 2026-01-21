/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  /**
   * Proxy API requests to the backend (avoids CORS/preflight issues).
   *
   * Env configuration (Vercel):
   * - BACKEND_URL must point to the real backend origin (ex: https://api.seudominio.com)
   * - Do NOT point BACKEND_URL to the same origin as this Next app
   *
   * Local usage:
   * - Backend at http://localhost:3000
   * - Admin at http://localhost:3001
   * - Call APIs as /api/*
   */
  async rewrites() {
    const isProd = process.env.NODE_ENV === 'production'
    const rawBackend = process.env.BACKEND_URL
    const rawSite =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined)

    const normalizeOrigin = (value) => {
      if (!value) return null
      try {
        const url = value.startsWith('http') ? value : `https://${value}`
        return new URL(url).origin
      } catch (error) {
        return null
      }
    }

    if (!rawBackend) {
      if (isProd) {
        throw new Error(
          'BACKEND_URL is required in production (set it to the real backend origin).'
        )
      }
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:3000/api/:path*'
        }
      ]
    }

    const backendOrigin = normalizeOrigin(rawBackend)
    const siteOrigin = normalizeOrigin(rawSite)

    if (backendOrigin && siteOrigin && backendOrigin === siteOrigin) {
      if (isProd) {
        throw new Error(
          'BACKEND_URL cannot match the admin origin; it must point to the real backend.'
        )
      }
      return []
    }

    return [
      {
        source: '/api/:path*',
        destination: `${rawBackend}/api/:path*`
      }
    ]
  }
}

export default nextConfig
