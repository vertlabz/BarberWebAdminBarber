/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  /**
   * Proxy de API (recomendado)
   * - Em DEV: BACKEND_URL = http://localhost:3000 (backend BackPack)
   * - Em PROD (Vercel): BACKEND_URL = https://SEU-BACKEND.vercel.app
   *
   * O front SEMPRE chama /api/* (mesma origem do Admin),
   * e o Next faz o rewrite para o backend — evitando CORS/preflight (OPTIONS 405)
   * e evitando dor de cabeça com cookies httpOnly (refresh token).
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
