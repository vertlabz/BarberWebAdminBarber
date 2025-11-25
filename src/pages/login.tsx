import { FormEvent, useState } from 'react'
import { useRouter } from 'next/router'
import api from '@/lib/api'
import { saveAuth } from '@/lib/auth'
import type { CurrentUser } from '@/types'
import Card from '@/components/Card'
import Button from '@/components/Button'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/api/auth/login', { email, password })
      const { accessToken, user } = res.data as {
        accessToken: string
        user: CurrentUser
      }
      saveAuth(accessToken, user)
      if (user.isProvider) router.push('/provider/dashboard')
      else router.push('/dashboard')
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || 'Falha ao entrar'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center mt-10">
      <Card className="w-full max-w-md">
        <h1 className="text-xl font-semibold mb-2">Bem-vindo de volta 👋</h1>
        <p className="text-sm text-slate-400 mb-6">
          Entre para gerenciar seus horários ou acompanhar seus agendamentos.
        </p>

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-slate-300">E-mail</label>
            <input
              type="email"
              className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-slate-300">Senha</label>
            <input
              type="password"
              className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <p className="text-xs text-slate-500 mt-4 text-center">
          Ainda não tem conta?{' '}
          <Link href="/register" className="text-brand-400 hover:text-brand-300">
            Fale com o administrador para criar.
          </Link>
        </p>
      </Card>
    </div>
  )
}
