import axios from 'axios'

/**
 * IMPORTANT:
 * - Use URLs RELATIVAS (ex: /api/auth/login).
 * - Com baseURL vazio, o browser chama o próprio domínio do Admin,
 *   e o next.config.mjs faz proxy para o backend via rewrites.
 */
const baseURL = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/+$/, '')

const api = axios.create({
  baseURL,
  withCredentials: true
})

export default api
