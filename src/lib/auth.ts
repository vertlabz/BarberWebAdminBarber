import type { CurrentUser } from '@/types'

const ACCESS_TOKEN_KEY = 'accessToken'
const CURRENT_USER_KEY = 'currentUser'

export function saveAuth(token: string, user: CurrentUser) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token)
  window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
}

export function clearAuth() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(ACCESS_TOKEN_KEY)
  window.localStorage.removeItem(CURRENT_USER_KEY)
}

export function getAuth():
  | { token: string; user: CurrentUser }
  | null {
  if (typeof window === 'undefined') return null
  const token = window.localStorage.getItem(ACCESS_TOKEN_KEY)
  const userStr = window.localStorage.getItem(CURRENT_USER_KEY)
  if (!token || !userStr) return null
  try {
    const user = JSON.parse(userStr) as CurrentUser
    return { token, user }
  } catch {
    return null
  }
}
