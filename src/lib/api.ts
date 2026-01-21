import axios from 'axios'

const api = axios.create({
  // Prefer same-origin requests ("/api/*") so Next rewrites can proxy to the backend
  // without CORS / preflight issues.
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  withCredentials: true
})

export default api
