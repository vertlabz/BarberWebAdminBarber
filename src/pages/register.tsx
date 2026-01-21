import { FormEvent, useState } from 'react'
import { useRouter } from 'next/router'
import api from '@/lib/api'
import Card from '@/components/Card'
import Button from '@/components/Button'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isProvider, setIsProvider] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      await api.post('/api/auth/register', { name, email, password, isProvider })
      setSuccess('Registrado com sucesso! Indo para login...')
      setTimeout(() => router.push('/login'), 800)
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'Erro ao registrar'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center mt-10">
      <Card className="w-full max-w-md">
        <h1 className="text-xl font-semibold mb-2">Cadastro</h1>
        <p className="text-sm text-slate-400 mb-6">Crie sua conta em poucos passos.</p>

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
        {success && <p className="mb-4 text-sm text-emerald-400">{success}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-slate-300">Nome</label>
            <input
              className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
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
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={isProvider}
              onChange={e => setIsProvider(e.target.checked)}
            />
            Sou barbeiro (provider)
          </label>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrar'}
          </Button>
        </form>

        <p className="text-xs text-slate-500 mt-4 text-center">
          Já possui conta?{' '}
          <Link href="/login" className="text-brand-400 hover:text-brand-300">
            Fazer login
          </Link>
        </p>
      </Card>
    </div>
  )
}
