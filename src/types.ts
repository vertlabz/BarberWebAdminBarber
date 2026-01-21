export type AppointmentStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'MISSED'

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
  service?: Service | null
}

export type CurrentUser = {
  id: string
  name: string
  email: string
  isProvider: boolean
}
