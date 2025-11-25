import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import api from '@/lib/api'
import { getAuth } from '@/lib/auth'
import type { Appointment, CurrentUser, Provider, Service } from '@/types'
import Card from '@/components/Card'
import Button from '@/components/Button'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [token, setToken] = useState<string | null>(null)

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loadingAppointments, setLoadingAppointments] = useState(true)
  const [errorAppointments, setErrorAppointments] = useState('')

  const [provider, setProvider] = useState<Provider | null>(null)
  const [providerLoading, setProviderLoading] = useState(true)
  const [providerError, setProviderError] = useState('')

  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [date, setDate] = useState<string>(() => {
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate() + 1).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  })

  const [slots, setSlots] = useState<string[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slotsError, setSlotsError] = useState('')
  const [bookingMessage, setBookingMessage] = useState('')
  const [bookingError, setBookingError] = useState('')
  const [bookingLoading, setBookingLoading] = useState(false)

  useEffect(() => {
    const auth = getAuth()
    if (!auth) {
      router.replace('/login')
      return
    }
    setUser(auth.user)
    setToken(auth.token)
  }, [router])

  useEffect(() => {
    if (!token) return

    async function loadAppointments() {
      setLoadingAppointments(true)
      setErrorAppointments('')
      try {
        const res = await api.get('/api/appointments', {
          headers: { Authorization: `Bearer ${token}` }
        })
        setAppointments(res.data.appointments || [])
      } catch (err: any) {
        const msg = err?.response?.data?.error || 'Erro ao carregar agendamentos'
        setErrorAppointments(msg)
      } finally {
        setLoadingAppointments(false)
      }
    }

    loadAppointments()
  }, [token])

  useEffect(() => {
    async function loadProvider() {
      setProviderLoading(true)
      setProviderError('')
      try {
        const res = await api.get('/api/providers')
        const first = (res.data.providers || [])[0] as Provider | undefined
        if (!first) {
          setProviderError('Nenhum barbeiro cadastrado.')
        } else {
          setProvider(first)
          if (first.services?.length > 0) setSelectedServiceId(first.services[0].id)
        }
      } catch (err: any) {
        const msg = err?.response?.data?.error || 'Erro ao carregar barbeiro'
        setProviderError(msg)
      } finally {
        setProviderLoading(false)
      }
    }

    loadProvider()
  }, [])

  async function loadSlots() {
    if (!provider) {
      setSlotsError('Barbeiro não encontrado')
      return
    }
    if (!selectedServiceId || !date) {
      setSlotsError('Selecione serviço e data')
      return
    }

    setSlotsError('')
    setSlots([])
    setSlotsLoading(true)
    try {
      const res = await api.get('/api/appointments/slots', {
        params: {
          providerId: provider.id,
          date,
          serviceId: selectedServiceId
        }
      })
      setSlots(res.data.slots || [])
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Erro ao carregar horários'
      setSlotsError(msg)
    } finally {
      setSlotsLoading(false)
    }
  }

  async function book(slotIso: string) {
    if (!token || !provider) return
    setBookingError('')
    setBookingMessage('')
    setBookingLoading(true)
    try {
      const res = await api.post(
        '/api/appointments',
        {
          providerId: provider.id,
          serviceId: selectedServiceId,
          date: slotIso,
          notes: ''
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setBookingMessage('Agendamento criado com sucesso!')
      setAppointments(prev => [res.data.appointment, ...prev])
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Erro ao criar agendamento'
      setBookingError(msg)
      if (msg.toLowerCase().includes('já existe um agendamento')) {
        await loadSlots()
      }
    } finally {
      setBookingLoading(false)
    }
  }

  if (!user) {
    return <div className="text-sm text-slate-400">Carregando...</div>
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Olá, {user.name}</h1>
          <p className="text-sm text-slate-400">
            Veja seus próximos horários e agende um novo corte.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Card de agendamento */}
        <Card className="lg:col-span-1">
          <h2 className="text-lg font-semibold mb-3">Agendar novo horário</h2>

          {providerLoading && <p className="text-sm text-slate-400">Carregando barbeiro...</p>}
          {providerError && <p className="text-sm text-red-400">{providerError}</p>}

          {provider && (
            <div className="space-y-3">
              <p className="text-sm text-slate-300">
                Barbeiro: <span className="font-medium">{provider.name}</span>
              </p>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Serviço</label>
                <select
                  className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm"
                  value={selectedServiceId}
                  onChange={e => setSelectedServiceId(e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {provider.services.map((s: Service) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {s.duration} min — R$ {s.price.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Data</label>
                <input
                  type="date"
                  className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
              </div>

              <Button
                type="button"
                className="w-full mt-1"
                onClick={loadSlots}
                disabled={slotsLoading}
              >
                {slotsLoading ? 'Carregando horários...' : 'Ver horários disponíveis'}
              </Button>

              {slotsError && <p className="text-xs text-red-400">{slotsError}</p>}

              <div className="mt-3">
                <p className="text-xs text-slate-400 mb-1">Horários disponíveis</p>
                {slotsLoading && <p className="text-xs text-slate-400">Buscando...</p>}
                {!slotsLoading && slots.length === 0 && (
                  <p className="text-xs text-slate-500">Nenhum horário para essa data.</p>
                )}
                <div className="flex flex-wrap gap-2 mt-1">
                  {slots.map(slot => {
                    const d = new Date(slot)
                    const label = d.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                    return (
                      <Button
                        key={slot}
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
              </div>

              {bookingError && <p className="text-xs text-red-400">{bookingError}</p>}
              {bookingMessage && <p className="text-xs text-emerald-400">{bookingMessage}</p>}
            </div>
          )}
        </Card>

        {/* Card de agendamentos */}
        <Card className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-3">Meus agendamentos</h2>
          {loadingAppointments && <p className="text-sm text-slate-400">Carregando...</p>}
          {errorAppointments && <p className="text-sm text-red-400">{errorAppointments}</p>}
          {!loadingAppointments && appointments.length === 0 && (
            <p className="text-sm text-slate-500">Você ainda não tem agendamentos.</p>
          )}

          <div className="space-y-3">
            {appointments.map(appt => {
              const d = new Date(appt.date)
              return (
                <div
                  key={appt.id}
                  className="flex items-start justify-between border border-slate-800 rounded-md px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {appt.service?.name || 'Serviço'} —{' '}
                      {appt.service ? `${appt.service.duration} min` : ''}
                    </p>
                    <p className="text-xs text-slate-400">
                      {d.toLocaleDateString()} às{' '}
                      {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Barbeiro: {appt.provider?.name || '—'}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-800 text-slate-200">
                    {appt.status}
                  </span>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}
