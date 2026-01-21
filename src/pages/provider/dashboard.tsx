import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import api from '@/lib/api'
import { getAuth } from '@/lib/auth'
import type { Appointment, CurrentUser, ProviderAvailability, ProviderBlock, Service } from '@/types'
import Card from '@/components/Card'
import Button from '@/components/Button'

const weekdayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function saoPauloTodayISO(): string {
  // en-CA yields YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date())
}

function formatTimeSP(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(iso))
}

export default function ProviderDashboardPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [auth, setAuth] = useState<{ token: string; user: CurrentUser } | null>(null)

  const [selectedDate, setSelectedDate] = useState<string>('')

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [appointmentsLoading, setAppointmentsLoading] = useState(false)
  const [appointmentsError, setAppointmentsError] = useState('')

  const [availabilities, setAvailabilities] = useState<ProviderAvailability[]>([])
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [availabilityError, setAvailabilityError] = useState('')
  const [availabilityMessage, setAvailabilityMessage] = useState('')
  const [newWeekday, setNewWeekday] = useState(1)
  const [newStartTime, setNewStartTime] = useState('09:00')
  const [newEndTime, setNewEndTime] = useState('18:00')

  const [services, setServices] = useState<Service[]>([])
  const [servicesLoading, setServicesLoading] = useState(false)
  const [servicesError, setServicesError] = useState('')

  const [blocks, setBlocks] = useState<ProviderBlock[]>([])
  const [blocksLoading, setBlocksLoading] = useState(false)
  const [blocksError, setBlocksError] = useState('')
  const [blockMessage, setBlockMessage] = useState('')
  const [blockStart, setBlockStart] = useState('')
  const [blockEnd, setBlockEnd] = useState('')
  const [blockReason, setBlockReason] = useState('')

  useEffect(() => {
    setMounted(true)
    const a = getAuth()
    if (!a) {
      router.replace('/login')
      return
    }
    if (!a.user.isProvider) {
      router.replace('/dashboard')
      return
    }
    setAuth(a)
    setSelectedDate(saoPauloTodayISO())
  }, [router])

  const token = auth?.token
  const userId = auth?.user.id

  const headers = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : undefined),
    [token]
  )

  // Agenda do dia
  useEffect(() => {
    if (!token || !selectedDate) return

    async function loadAppointments() {
      setAppointmentsLoading(true)
      setAppointmentsError('')
      try {
        const res = await api.get('/api/provider/appointments', {
          params: { date: selectedDate },
          headers
        })
        setAppointments(res.data.appointments || [])
      } catch (err: any) {
        const msg = err?.response?.data?.error || err?.response?.data?.message || 'Erro ao carregar agenda'
        setAppointmentsError(msg)
      } finally {
        setAppointmentsLoading(false)
      }
    }

    loadAppointments()
  }, [token, selectedDate, headers])

  // Disponibilidades
  useEffect(() => {
    if (!token) return

    async function loadAvailabilities() {
      setAvailabilityLoading(true)
      setAvailabilityError('')
      try {
        const res = await api.get('/api/provider/availability', { headers })
        setAvailabilities(res.data.availabilities || [])
      } catch (err: any) {
        const msg = err?.response?.data?.error || err?.response?.data?.message || 'Erro ao carregar disponibilidades'
        setAvailabilityError(msg)
      } finally {
        setAvailabilityLoading(false)
      }
    }

    loadAvailabilities()
  }, [token, headers])

  // Serviços (do provider)
  useEffect(() => {
    if (!token || !userId) return

    async function loadServices() {
      setServicesLoading(true)
      setServicesError('')
      try {
        // Endpoint público (sem auth) existe no backend, mas manter auth não machuca.
        const res = await api.get(`/api/providers/${userId}`)
        setServices(res.data.provider?.services || [])
      } catch (err: any) {
        const msg = err?.response?.data?.error || err?.response?.data?.message || 'Erro ao carregar serviços'
        setServicesError(msg)
      } finally {
        setServicesLoading(false)
      }
    }

    loadServices()
  }, [token, userId])

  // Bloqueios
  useEffect(() => {
    if (!token) return

    async function loadBlocks() {
      setBlocksLoading(true)
      setBlocksError('')
      try {
        const res = await api.get('/api/provider/blocks', { headers })
        setBlocks(res.data.blocks || [])
      } catch (err: any) {
        const msg = err?.response?.data?.error || err?.response?.data?.message || 'Erro ao carregar bloqueios'
        setBlocksError(msg)
      } finally {
        setBlocksLoading(false)
      }
    }

    loadBlocks()
  }, [token, headers])

  async function handleCreateAvailability() {
    if (!token) return
    setAvailabilityMessage('')
    setAvailabilityError('')

    try {
      const res = await api.post(
        '/api/provider/availability',
        { weekday: newWeekday, startTime: newStartTime, endTime: newEndTime },
        { headers }
      )
      setAvailabilities(prev => [...prev, res.data.availability])
      setAvailabilityMessage('Disponibilidade criada!')
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || 'Erro ao criar disponibilidade'
      setAvailabilityError(msg)
    }
  }

  async function handleDeleteAvailability(id: string) {
    if (!token) return
    setAvailabilityMessage('')
    setAvailabilityError('')

    try {
      await api.delete(`/api/provider/availability/${id}`, { headers })
      setAvailabilities(prev => prev.filter(a => a.id !== id))
      setAvailabilityMessage('Disponibilidade removida!')
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || 'Erro ao remover disponibilidade'
      setAvailabilityError(msg)
    }
  }

  async function handleCreateBlock() {
    if (!token) return
    setBlockMessage('')
    setBlocksError('')

    try {
      const res = await api.post(
        '/api/provider/blocks',
        { startAt: blockStart, endAt: blockEnd, reason: blockReason || null },
        { headers }
      )
      setBlocks(prev => [...prev, res.data.block])
      setBlockMessage('Bloqueio criado!')
      setBlockStart('')
      setBlockEnd('')
      setBlockReason('')
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || 'Erro ao criar bloqueio'
      setBlocksError(msg)
    }
  }

  if (!mounted || !auth) {
    return <div className="text-sm text-slate-400">Carregando...</div>
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Painel do barbeiro</h1>
          <p className="text-sm text-slate-400">Olá, {auth.user.name}. Gerencie agenda, horários e bloqueios.</p>
        </div>
        <Button variant="secondary" onClick={() => router.push('/provider/settings')}>Configurações</Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Agenda do dia */}
        <Card className="lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <h2 className="text-lg font-semibold">Agenda do dia</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Data</span>
              <input
                type="date"
                className="rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-sm"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
              />
            </div>
          </div>

          {appointmentsLoading && <p className="text-sm text-slate-400">Carregando agenda...</p>}
          {appointmentsError && <p className="text-sm text-red-400">{appointmentsError}</p>}
          {!appointmentsLoading && !appointmentsError && appointments.length === 0 && (
            <p className="text-sm text-slate-500">Nenhum horário marcado neste dia.</p>
          )}

          <div className="space-y-3">
            {appointments.map(appt => (
              <div key={appt.id} className="border border-slate-800 rounded-md px-3 py-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">
                      {appt.service?.name || 'Serviço'}
                      {appt.service ? ` — ${appt.service.duration} min` : ''}
                    </p>
                    <p className="text-xs text-slate-400">{formatTimeSP(appt.date)}</p>
                    {appt.customer && (
                      <p className="text-xs text-slate-500 mt-1">Cliente: {appt.customer.name}</p>
                    )}
                    {appt.notes && <p className="text-xs text-slate-500 mt-1">Obs: {appt.notes}</p>}
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-800 text-slate-200">
                    {appt.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Serviços */}
        <Card className="lg:col-span-1">
          <h2 className="text-lg font-semibold mb-2">Serviços</h2>
          {servicesLoading && <p className="text-sm text-slate-400">Carregando...</p>}
          {servicesError && <p className="text-sm text-red-400">{servicesError}</p>}
          {!servicesLoading && !servicesError && services.length === 0 && (
            <p className="text-sm text-slate-500">Nenhum serviço cadastrado.</p>
          )}
          <ul className="mt-2 space-y-2">
            {services.map(s => (
              <li key={s.id} className="text-sm text-slate-200">
                {s.name} — {s.duration} min — R$ {s.price.toFixed(2)}
              </li>
            ))}
          </ul>
          <p className="text-xs text-slate-500 mt-3">
            A duração do serviço é usada como intervalo para calcular os slots.
          </p>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Disponibilidades */}
        <Card>
          <h2 className="text-lg font-semibold mb-3">Disponibilidades semanais</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-400">Dia</label>
              <select
                className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-sm"
                value={newWeekday}
                onChange={e => setNewWeekday(Number(e.target.value))}
              >
                {weekdayLabels.map((label, idx) => (
                  <option key={idx} value={idx}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400">Início</label>
              <input
                type="time"
                className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-sm"
                value={newStartTime}
                onChange={e => setNewStartTime(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Fim</label>
              <input
                type="time"
                className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-sm"
                value={newEndTime}
                onChange={e => setNewEndTime(e.target.value)}
              />
            </div>
          </div>
          <Button className="w-full mt-3" type="button" onClick={handleCreateAvailability}>
            Salvar disponibilidade
          </Button>
          {availabilityError && <p className="text-sm text-red-400 mt-2">{availabilityError}</p>}
          {availabilityMessage && <p className="text-sm text-emerald-400 mt-2">{availabilityMessage}</p>}

          <div className="mt-5">
            <h3 className="text-sm font-semibold mb-2">Minhas disponibilidades</h3>
            {availabilityLoading && <p className="text-sm text-slate-400">Carregando...</p>}
            {!availabilityLoading && availabilities.length === 0 && (
              <p className="text-sm text-slate-500">Nenhuma disponibilidade cadastrada ainda.</p>
            )}
            <div className="space-y-2">
              {availabilities.map(a => (
                <div key={a.id} className="flex items-center justify-between gap-3 border border-slate-800 rounded-md px-3 py-2">
                  <div className="text-sm text-slate-200">
                    {weekdayLabels[a.weekday]}: {a.startTime} - {a.endTime}
                  </div>
                  <Button variant="ghost" className="text-xs px-3 py-1" onClick={() => handleDeleteAvailability(a.id)}>
                    Remover
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Bloqueios */}
        <Card>
          <h2 className="text-lg font-semibold mb-1">Bloqueios</h2>
          <p className="text-sm text-slate-400">Férias, almoço, manutenção, etc.</p>

          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            <div>
              <label className="text-xs text-slate-400">Início</label>
              <input
                type="datetime-local"
                className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-sm"
                value={blockStart}
                onChange={e => setBlockStart(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Fim</label>
              <input
                type="datetime-local"
                className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-sm"
                value={blockEnd}
                onChange={e => setBlockEnd(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="text-xs text-slate-400">Motivo (opcional)</label>
            <input
              className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-sm"
              value={blockReason}
              onChange={e => setBlockReason(e.target.value)}
              placeholder="Férias, almoço..."
            />
          </div>
          <Button className="w-full mt-3" type="button" onClick={handleCreateBlock}>
            Criar bloqueio
          </Button>

          {blocksError && <p className="text-sm text-red-400 mt-2">{blocksError}</p>}
          {blockMessage && <p className="text-sm text-emerald-400 mt-2">{blockMessage}</p>}

          <div className="mt-5">
            <h3 className="text-sm font-semibold mb-2">Bloqueios cadastrados</h3>
            {blocksLoading && <p className="text-sm text-slate-400">Carregando...</p>}
            {!blocksLoading && blocks.length === 0 && (
              <p className="text-sm text-slate-500">Nenhum bloqueio cadastrado.</p>
            )}
            <div className="space-y-2">
              {blocks.map(b => (
                <div key={b.id} className="border border-slate-800 rounded-md px-3 py-2">
                  <p className="text-sm text-slate-200">
                    {b.reason || 'Bloqueio'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(b.startAt).toLocaleString()} → {new Date(b.endAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
