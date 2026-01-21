import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import api from '@/lib/api'
import { getAuth } from '@/lib/auth'
import type { CurrentUser, ProviderConfig, Service } from '@/types'
import Card from '@/components/Card'
import Button from '@/components/Button'

function saoPauloTomorrowISO(): string {
  const now = new Date()
  const spDate = new Date(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(now)
  )
  // The Date() above may parse as UTC; we only need YYYY-MM-DD for the input.
  // So compute tomorrow in a simpler, client-safe way:
  const yyyy = Number(new Intl.DateTimeFormat('en', { timeZone: 'America/Sao_Paulo', year: 'numeric' }).format(now))
  const mm = Number(new Intl.DateTimeFormat('en', { timeZone: 'America/Sao_Paulo', month: '2-digit' }).format(now))
  const dd = Number(new Intl.DateTimeFormat('en', { timeZone: 'America/Sao_Paulo', day: '2-digit' }).format(now))

  const tomorrow = new Date(Date.UTC(yyyy, mm - 1, dd + 1))
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(tomorrow)
}

function formatTimeSP(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(iso))
}

export default function ProviderSettingsPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [auth, setAuth] = useState<{ token: string; user: CurrentUser } | null>(null)

  const [config, setConfig] = useState<ProviderConfig>({ maxBookingDays: 7, cancelBookingHours: 2 })
  const [configLoading, setConfigLoading] = useState(false)
  const [configMessage, setConfigMessage] = useState('')
  const [configError, setConfigError] = useState('')

  const [services, setServices] = useState<Service[]>([])
  const [servicesLoading, setServicesLoading] = useState(false)
  const [servicesMessage, setServicesMessage] = useState('')
  const [servicesError, setServicesError] = useState('')
  const [newServiceName, setNewServiceName] = useState('')
  const [newServiceDuration, setNewServiceDuration] = useState(30)
  const [newServicePrice, setNewServicePrice] = useState(50)

  // Preview slots
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [date, setDate] = useState('')
  const [slots, setSlots] = useState<string[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slotsError, setSlotsError] = useState('')

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
    setDate(saoPauloTomorrowISO())
  }, [router])

  const token = auth?.token
  const headers = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : undefined),
    [token]
  )

  useEffect(() => {
    if (!token) return
    async function loadConfig() {
      setConfigLoading(true)
      setConfigError('')
      try {
        const res = await api.get('/api/provider/config', { headers })
        setConfig({
          maxBookingDays: res.data.maxBookingDays ?? 7,
          cancelBookingHours: res.data.cancelBookingHours ?? 2
        })
      } catch (err: any) {
        const msg = err?.response?.data?.error || err?.response?.data?.message || 'Erro ao carregar configuração'
        setConfigError(msg)
      } finally {
        setConfigLoading(false)
      }
    }
    loadConfig()
  }, [token, headers])

  useEffect(() => {
    if (!token) return
    async function loadServices() {
      setServicesLoading(true)
      setServicesError('')
      try {
        const res = await api.get('/api/provider/services', { headers })
        const list = (res.data.services || []) as Service[]
        setServices(list)
        if (!selectedServiceId && list.length > 0) setSelectedServiceId(list[0].id)
      } catch (err: any) {
        const msg = err?.response?.data?.error || err?.response?.data?.message || 'Erro ao carregar serviços'
        setServicesError(msg)
      } finally {
        setServicesLoading(false)
      }
    }
    loadServices()
  }, [token, headers])

  async function handleSaveConfig() {
    if (!token) return
    setConfigMessage('')
    setConfigError('')
    try {
      await api.post('/api/provider/config', config, { headers })
      setConfigMessage('Configurações atualizadas!')
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || 'Erro ao salvar configuração'
      setConfigError(msg)
    }
  }

  async function handleCreateService() {
    if (!token) return
    setServicesMessage('')
    setServicesError('')
    try {
      const res = await api.post(
        '/api/provider/services',
        { name: newServiceName, duration: newServiceDuration, price: newServicePrice },
        { headers }
      )
      const created = res.data.service as Service
      setServices(prev => [...prev, created])
      setServicesMessage('Serviço criado!')
      setNewServiceName('')
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || 'Erro ao criar serviço'
      setServicesError(msg)
    }
  }

  async function handleDeleteService(id: string) {
    if (!token) return
    setServicesMessage('')
    setServicesError('')
    try {
      await api.delete(`/api/provider/services/${id}`, { headers })
      setServices(prev => prev.filter(s => s.id !== id))
      setServicesMessage('Serviço removido!')
      if (selectedServiceId === id) setSelectedServiceId('')
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || 'Erro ao remover serviço'
      setServicesError(msg)
    }
  }

  async function loadSlots() {
    if (!auth?.user?.id || !selectedServiceId || !date) {
      setSlotsError('Selecione serviço e data')
      return
    }

    setSlotsError('')
    setSlots([])
    setSlotsLoading(true)
    try {
      const res = await api.get('/api/appointments/slots', {
        params: { providerId: auth.user.id, date, serviceId: selectedServiceId }
      })
      setSlots(res.data.slots || [])
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || 'Erro ao carregar horários'
      setSlotsError(msg)
    } finally {
      setSlotsLoading(false)
    }
  }

  if (!mounted || !auth) {
    return <div className="text-sm text-slate-400">Carregando...</div>
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Configurações do barbeiro</h1>
          <p className="text-sm text-slate-400">Ajuste limite de agenda, serviços e visualize slots.</p>
        </div>
        <Button variant="secondary" onClick={() => router.push('/provider/dashboard')}>Voltar ao painel</Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <h2 className="text-lg font-semibold">Limites</h2>
          <p className="text-sm text-slate-400 mt-1">
            Define quantos dias à frente o cliente pode agendar e o prazo mínimo de cancelamento.
          </p>

          {configLoading && <p className="text-sm text-slate-400 mt-3">Carregando...</p>}
          {configError && <p className="text-sm text-red-400 mt-3">{configError}</p>}
          {configMessage && <p className="text-sm text-emerald-400 mt-3">{configMessage}</p>}

          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs text-slate-400">Máximo de dias à frente</label>
              <input
                type="number"
                min={1}
                max={60}
                className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-sm"
                value={config.maxBookingDays}
                onChange={e => setConfig(prev => ({ ...prev, maxBookingDays: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Cancelamento permitido até (horas antes)</label>
              <input
                type="number"
                min={0}
                max={72}
                className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-sm"
                value={config.cancelBookingHours}
                onChange={e => setConfig(prev => ({ ...prev, cancelBookingHours: Number(e.target.value) }))}
              />
            </div>
          </div>
          <Button className="w-full mt-4" type="button" onClick={handleSaveConfig}>
            Salvar
          </Button>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="text-lg font-semibold">Serviços</h2>
          <p className="text-sm text-slate-400 mt-1">Crie e remova serviços do barbeiro.</p>

          {servicesError && <p className="text-sm text-red-400 mt-3">{servicesError}</p>}
          {servicesMessage && <p className="text-sm text-emerald-400 mt-3">{servicesMessage}</p>}

          <div className="grid sm:grid-cols-3 gap-3 mt-4">
            <div className="sm:col-span-1">
              <label className="text-xs text-slate-400">Nome</label>
              <input
                className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-sm"
                value={newServiceName}
                onChange={e => setNewServiceName(e.target.value)}
                placeholder="Corte, Barba..."
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Duração (min)</label>
              <input
                type="number"
                min={5}
                className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-sm"
                value={newServiceDuration}
                onChange={e => setNewServiceDuration(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Preço (R$)</label>
              <input
                type="number"
                step="0.01"
                min={0}
                className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-sm"
                value={newServicePrice}
                onChange={e => setNewServicePrice(Number(e.target.value))}
              />
            </div>
          </div>
          <Button className="w-full mt-3" type="button" onClick={handleCreateService} disabled={!newServiceName.trim()}>
            Criar serviço
          </Button>

          <div className="mt-5">
            <h3 className="text-sm font-semibold mb-2">Meus serviços</h3>
            {servicesLoading && <p className="text-sm text-slate-400">Carregando...</p>}
            {!servicesLoading && services.length === 0 && (
              <p className="text-sm text-slate-500">Nenhum serviço cadastrado.</p>
            )}
            <div className="space-y-2">
              {services.map(s => (
                <div key={s.id} className="flex items-center justify-between gap-3 border border-slate-800 rounded-md px-3 py-2">
                  <div className="text-sm text-slate-200">
                    {s.name} — {s.duration} min — R$ {s.price.toFixed(2)}
                  </div>
                  <Button variant="ghost" className="text-xs px-3 py-1" onClick={() => handleDeleteService(s.id)}>
                    Remover
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-semibold">Preview de horários disponíveis</h2>
        <p className="text-sm text-slate-400 mt-1">
          Calculado com base nas disponibilidades, bloqueios e duração do serviço selecionado.
        </p>

        <div className="grid sm:grid-cols-3 gap-3 mt-4">
          <div className="sm:col-span-1">
            <label className="text-xs text-slate-400">Serviço</label>
            <select
              className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-sm"
              value={selectedServiceId}
              onChange={e => setSelectedServiceId(e.target.value)}
            >
              <option value="">Selecione...</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.duration} min
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
          <div className="flex items-end">
            <Button className="w-full" type="button" onClick={loadSlots} disabled={slotsLoading}>
              {slotsLoading ? 'Carregando...' : 'Ver slots'}
            </Button>
          </div>
        </div>

        {slotsError && <p className="text-sm text-red-400 mt-3">{slotsError}</p>}

        <div className="mt-4">
          <h3 className="text-sm font-semibold mb-2">Slots</h3>
          {!slotsLoading && slots.length === 0 && <p className="text-sm text-slate-500">Nenhum slot disponível.</p>}
          <div className="flex flex-wrap gap-2">
            {slots.map(slot => (
              <span key={slot} className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-200">
                {formatTimeSP(slot)}
              </span>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
