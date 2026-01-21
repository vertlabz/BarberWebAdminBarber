/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  /**
   * Proxy API requests to the backend.
   * This avoids CORS + preflight (OPTIONS 405) issues when the admin runs on a
   * different origin than the backend.
   *
   * Usage:
   * - Run backend at http://localhost:3000
   * - Run this admin at http://localhost:3001
   * - Call APIs as /api/* from the browser
   */
  async rewrites() {
    /**
     * Production Vercel configuration:
     * - BACKEND_URL must point to the real backend origin (e.g. https://api.example.com)
     * - Never set BACKEND_URL to this admin's own domain (to avoid redirect loops)
     * - Optional: NEXT_PUBLIC_SITE_URL can be set to this admin's full URL to validate config
     */
    const backend = process.env.BACKEND_URL?.trim()
    if (!backend) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('BACKEND_URL is required in production (e.g. https://api.example.com).')
      }
      console.warn('[rewrites] BACKEND_URL not set. Skipping API proxy rewrites.')
      return []
    }

    const normalizeOrigin = (value: string) => {
      const withProtocol = value.startsWith('http') ? value : `https://${value}`
      const url = new URL(withProtocol)
      return { origin: url.origin, hostname: url.hostname }
    }

    const backendUrl = normalizeOrigin(backend)
    const siteUrlRaw = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
    if (siteUrlRaw) {
      const siteUrl = normalizeOrigin(siteUrlRaw)
      if (backendUrl.hostname === siteUrl.hostname) {
        if (process.env.NODE_ENV === 'production') {
          throw new Error(
            `BACKEND_URL (${backendUrl.origin}) cannot point to the same host as this admin (${siteUrl.origin}).`
          )
        }
        console.warn('[rewrites] BACKEND_URL points to this admin host. Skipping API proxy rewrites.')
        return []
      }
    }

    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl.origin}/api/:path*`
      }
    ]
  }
}

export default nextConfig
