import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useStore } from '@/store/useStore'
import { useEffect } from 'react'
import type { Notificacion } from '../types'

export function useAlertas(todas: boolean = false) {
  const setNotificacionesNoLeidas = useStore((s) => s.setNotificacionesNoLeidas)

  const query = useQuery({
    queryKey: ['alertas', todas],
    queryFn: () => fetch(`/api/alertas?todas=${todas}`).then(async r => {
      const json = await r.json()
      if (!r.ok || !json.ok) {
        throw new Error(json.error?.message || 'Error al obtener alertas')
      }
      return json.data as Notificacion[]
    }),
    refetchInterval: 30000, // Auto-refresh every 30s
  })

  // Update unread count in Zustand store whenever query data changes
  useEffect(() => {
    if (query.data && !todas) {
      setNotificacionesNoLeidas(query.data.length)
    }
  }, [query.data, todas, setNotificacionesNoLeidas])

  return query
}

export function useMarkAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => fetch(`/api/alertas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leida: true }),
    }).then(async r => {
      const json = await r.json()
      if (!r.ok || !json.ok) {
        throw new Error(json.error?.message || 'Error al marcar como leída')
      }
      return json.data
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas'] })
    },
  })
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      // Use bulk endpoint to mark all as read in single transaction
      const response = await fetch('/api/alertas/mark-all-read', {
        method: 'PUT',
      })
      const json = await response.json()
      if (!response.ok || !json.ok) {
        throw new Error(json.error?.message || 'Error al marcar todas como leídas')
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas'] })
    },
  })
}
