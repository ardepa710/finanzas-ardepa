import type { TipoNotificacion, Prioridad } from '@/generated/prisma/enums'

export type { TipoNotificacion, Prioridad }

export interface Notificacion {
  id: string
  tipo: TipoNotificacion
  titulo: string
  mensaje: string
  prioridad: Prioridad
  leida: boolean
  createdAt: Date
  metadata?: Record<string, any>
}
