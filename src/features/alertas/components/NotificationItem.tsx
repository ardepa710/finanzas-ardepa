'use client'
import type { Notificacion } from '../types'
import { TipoNotificacion, Prioridad } from '@/generated/prisma/enums'
import { TIPO_ICONS, PRIORITY_COLORS } from '../constants'

interface NotificationItemProps {
  notificacion: Notificacion
  onMarkAsRead: (id: string) => void
}

// Format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Justo ahora'
  if (minutes < 60) return `Hace ${minutes} min`
  if (hours < 24) return `Hace ${hours} h`
  if (days < 7) return `Hace ${days} d`

  return new Date(date).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short'
  })
}

export default function NotificationItem({ notificacion, onMarkAsRead }: NotificationItemProps) {
  const colors = PRIORITY_COLORS[notificacion.prioridad as Prioridad]
  const icon = TIPO_ICONS[notificacion.tipo as TipoNotificacion]

  return (
    <div
      className={`p-3 border-l-4 ${colors.border} ${colors.bg} rounded-r-lg transition-opacity ${
        notificacion.leida ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-semibold text-slate-200 leading-tight">
              {notificacion.titulo}
            </h4>
            <span className="text-xs text-slate-500 flex-shrink-0">
              {formatRelativeTime(notificacion.createdAt)}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            {notificacion.mensaje}
          </p>
          {!notificacion.leida && (
            <button
              onClick={() => onMarkAsRead(notificacion.id)}
              className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Marcar como leída
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
