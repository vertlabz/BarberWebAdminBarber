// Types shared across pages/components.
// Keep these aligned with the BackPack backend Prisma schema + API responses.

export type AppointmentStatus = 'SCHEDULED' | 'CANCELED' | 'DONE'

export type Service = {
  id: string
  name: string
  duration: number
  price: number
}

export type Provider = {
  id: string
  name: string
  email: string
  services: Service[]
}

export type Appointment = {
  id: string
  date: string
  status: AppointmentStatus
  notes?: string | null
  provider?: { id: string; name: string; email: string }
  customer?: { id: string; name: string; email: string }
  service?: Service | null
}

export type CurrentUser = {
  id: string
  name: string
  email: string
  isProvider: boolean
}

export type ProviderAvailability = {
  id: string
  weekday: number
  startTime: string
  endTime: string
}

export type ProviderBlock = {
  id: string
  startAt: string
  endAt: string
  reason?: string | null
}

export type ProviderConfig = {
  maxBookingDays: number
  cancelBookingHours: number
}
