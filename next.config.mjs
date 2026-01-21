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
    const backend = process.env.BACKEND_URL || 'http://localhost:3000'
    return [
      {
        source: '/api/:path*',
        destination: `${backend}/api/:path*`
      }
    ]
  }
}

export default nextConfig
