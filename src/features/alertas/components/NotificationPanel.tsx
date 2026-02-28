'use client'
import { useEffect } from 'react'
import { useAlertas, useMarkAsRead, useMarkAllAsRead } from '../hooks/useAlertas'
import NotificationItem from './NotificationItem'
import { useToast } from '@/shared/hooks/useToast'

interface NotificationPanelProps {
  isOpen: boolean
  onClose: () => void
}

export default function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const { data: notificaciones, isLoading, error } = useAlertas(false)
  const markAsRead = useMarkAsRead()
  const markAllAsRead = useMarkAllAsRead()
  const toast = useToast()

  const handleMarkAsRead = (id: string) => {
    markAsRead.mutate(id, {
      onSuccess: () => {
        toast.add({
          type: 'success',
          title: 'Notificación marcada',
          message: 'La notificación se marcó como leída',
          duration: 2000,
        })
      },
      onError: (error: any) => {
        toast.add({
          type: 'error',
          title: 'Error',
          message: error.message || 'No se pudo marcar la notificación',
        })
      },
    })
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate(undefined, {
      onSuccess: () => {
        toast.add({
          type: 'success',
          title: 'Notificaciones marcadas',
          message: 'Todas las notificaciones se marcaron como leídas',
          duration: 2000,
        })
      },
      onError: (error: any) => {
        toast.add({
          type: 'error',
          title: 'Error',
          message: error.message || 'No se pudieron marcar las notificaciones',
        })
      },
    })
  }

  // Escape key to close panel
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-labelledby="notification-header"
        className="absolute top-14 right-4 w-96 max-h-[32rem] bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h3 id="notification-header" className="text-sm font-semibold text-slate-200">Notificaciones</h3>
          {notificaciones && notificaciones.length > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={markAllAsRead.isPending}
              className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-50"
            >
              {markAllAsRead.isPending ? 'Marcando...' : 'Marcar todas'}
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {isLoading && (
            <div className="text-center py-8">
              <p className="text-sm text-slate-400">Cargando...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-sm text-red-400">
                Error: {error instanceof Error ? error.message : 'Error al cargar notificaciones'}
              </p>
            </div>
          )}

          {!isLoading && !error && notificaciones && notificaciones.length === 0 && (
            <div className="text-center py-12">
              <span className="text-4xl mb-2 block">📭</span>
              <p className="text-sm text-slate-400">No hay notificaciones</p>
            </div>
          )}

          {!isLoading && !error && notificaciones && notificaciones.length > 0 && (
            <>
              {notificaciones.map((notificacion) => (
                <NotificationItem
                  key={notificacion.id}
                  notificacion={notificacion}
                  onMarkAsRead={handleMarkAsRead}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </>
  )
}
