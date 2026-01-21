import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import api from '@/lib/api'
import { getAuth } from '@/lib/auth'
import Card from '@/components/Card'
import Button from '@/components/Button'
import type { Provider, Service } from '@/types'

function saoPauloTomorrowISO(): string {
  // en-CA yields YYYY-MM-DD
  const today = new Date()
  const yyyy = Number(new Intl.DateTimeFormat('en', { timeZone: 'America/Sao_Paulo', year: 'numeric' }).format(today))
  const mm = Number(new Intl.DateTimeFormat('en', { timeZone: 'America/Sao_Paulo', month: '2-digit' }).format(today))
  const dd = Number(new Intl.DateTimeFormat('en', { timeZone: 'America/Sao_Paulo', day: '2-digit' }).format(today))
  const tomorrow = new Date(Date.UTC(yyyy, mm - 1, dd + 1))
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(tomorrow)
}

export default function BookPage() {
  const router = useRouter()
  const { providerId } = router.query

  const [mounted, setMounted] = useState(false)
  const [token, setToken] = useState<string | null>(null)

  const [provider, setProvider] = useState<Provider | null>(null)
  const [providerLoading, setProviderLoading] = useState(true)
  const [providerError, setProviderError] = useState('')

  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [date, setDate] = useState('')

  const [slots, setSlots] = useState<string[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slotsError, setSlotsError] = useState('')

  const [bookingMessage, setBookingMessage] = useState('')
  const [bookingError, setBookingError] = useState('')
  const [bookingLoading, setBookingLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
    const auth = getAuth()
    if (!auth) {
      router.replace('/login')
      return
    }
    setToken(auth.token)
    setDate(saoPauloTomorrowISO())
  }, [router])

  useEffect(() => {
    if (!providerId) return

    async function loadProvider() {
      setProviderLoading(true)
      setProviderError('')
      try {
        const res = await api.get(`/api/providers/${providerId}`)
        const p = res.data.provider as Provider
        setProvider(p)
        if (p?.services?.length) setSelectedServiceId(p.services[0].id)
      } catch (err: any) {
        const msg = err?.response?.data?.error || err?.response?.data?.message || 'Erro ao carregar barbeiro'
        setProviderError(msg)
      } finally {
        setProviderLoading(false)
      }
    }

    loadProvider()
  }, [providerId])

  async function loadSlots() {
    if (!providerId || !selectedServiceId || !date) {
      setSlotsError('Selecione serviço e data')
      return
    }
    setSlotsError('')
    setSlots([])
    setSlotsLoading(true)
    try {
      const res = await api.get('/api/appointments/slots', {
        params: { providerId, date, serviceId: selectedServiceId }
      })
      setSlots(res.data.slots || [])
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || 'Erro ao carregar horários'
      setSlotsError(msg)
    } finally {
      setSlotsLoading(false)
    }
  }

  async function book(slotIso: string) {
    if (!token) {
      router.replace('/login')
      return
    }
    setBookingMessage('')
    setBookingError('')
    setBookingLoading(true)
    try {
      await api.post(
        '/api/appointments',
        { providerId, serviceId: selectedServiceId, date: slotIso, notes: '' },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setBookingMessage('Agendamento criado com sucesso!')
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || 'Erro ao criar agendamento'
      setBookingError(msg)
    } finally {
      setBookingLoading(false)
    }
  }

  if (!mounted) return <div className="text-sm text-slate-400">Carregando...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Agendar horário</h1>
        <p className="text-sm text-slate-400">Escolha serviço, data e um horário disponível.</p>
      </div>

      <Card>
        {providerLoading && <p className="text-sm text-slate-400">Carregando barbeiro...</p>}
        {providerError && <p className="text-sm text-red-400">{providerError}</p>}

        {provider && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">{provider.name}</h2>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs text-slate-400">Serviço</label>
                <select
                  className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-sm"
                  value={selectedServiceId}
                  onChange={e => setSelectedServiceId(e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {provider.services?.map((s: Service) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {s.duration} min — R$ {s.price.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400">Data</label>
                <input
                  type="date"
                  className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-sm"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
              </div>
            </div>

            <Button type="button" onClick={loadSlots} disabled={slotsLoading}>
              {slotsLoading ? 'Carregando horários...' : 'Ver horários disponíveis'}
            </Button>
            {slotsError && <p className="text-sm text-red-400">{slotsError}</p>}

            <div>
              <h3 className="text-sm font-semibold mb-2">Horários disponíveis</h3>
              {!slotsLoading && slots.length === 0 && (
                <p className="text-sm text-slate-500">Nenhum horário disponível para este dia.</p>
              )}
              <div className="flex flex-wrap gap-2">
                {slots.map(slot => {
                  const label = new Date(slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  return (
                    <Button
                      key={slot}
                      type="button"
                      variant="secondary"
                      className="text-xs px-3 py-1"
                      onClick={() => book(slot)}
                      disabled={bookingLoading}
                    >
                      {label}
                    </Button>
                  )
                })}
              </div>
              {bookingError && <p className="text-sm text-red-400 mt-2">{bookingError}</p>}
              {bookingMessage && <p className="text-sm text-emerald-400 mt-2">{bookingMessage}</p>}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
