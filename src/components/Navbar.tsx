import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import Button from './Button'
import { clearAuth, getAuth } from '@/lib/auth'
import type { CurrentUser } from '@/types'

export default function Navbar() {
  const router = useRouter()
  // IMPORTANT: avoid hydration mismatch by only reading localStorage on the client after mount.
  const [mounted, setMounted] = useState(false)
  const [auth, setAuth] = useState<{ token: string; user: CurrentUser } | null>(null)

  useEffect(() => {
    setMounted(true)
    setAuth(getAuth())

    // Keep navbar in sync if auth changes in another tab.
    const onStorage = () => setAuth(getAuth())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const isProvider = useMemo(() => Boolean(auth?.user?.isProvider), [auth])

  async function handleLogout() {
    clearAuth()
    setAuth(null)
    router.push('/login')
  }

  return (
    <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-brand-500 flex items-center justify-center text-xs font-bold">
            BB
          </div>
          <span className="font-semibold text-slate-100">Barber Admin</span>
        </Link>

        <div className="flex items-center gap-3">
          {mounted && isProvider && (
            <>
              <Link href="/provider/dashboard" className="text-sm text-slate-300 hover:text-white">
                Painel do barbeiro
              </Link>
              <Link href="/provider/settings" className="text-sm text-slate-300 hover:text-white">
                Configurações
              </Link>
            </>
          )}
          <Link href="/dashboard" className="text-sm text-slate-300 hover:text-white">
            Meus agendamentos
          </Link>

          {mounted && auth ? (
            <Button variant="ghost" onClick={handleLogout}>
              Sair
            </Button>
          ) : (
            <Link href="/login">
              <Button variant="primary">Entrar</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
