'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function usePerfil() {
  return useQuery({
    queryKey: ['gamificacion', 'perfil'],
    queryFn: async () => {
      const res = await fetch('/api/gamificacion/perfil')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
      return json.data
    },
  })
}

export function useLogros() {
  return useQuery({
    queryKey: ['gamificacion', 'logros'],
    queryFn: async () => {
      const res = await fetch('/api/gamificacion/logros')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
      return json.data
    },
  })
}

export function useStreaks() {
  return useQuery({
    queryKey: ['gamificacion', 'streaks'],
    queryFn: async () => {
      const res = await fetch('/api/gamificacion/streaks')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
      return json.data
    },
  })
}

export function useCheckLogros() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/gamificacion/check-logros', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
      return json.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gamificacion'] })
    },
  })
}
