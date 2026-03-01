'use client'
import { useQuery } from '@tanstack/react-query'
import type { InsightGenerado } from '../types'

async function fetchInsights(): Promise<InsightGenerado[]> {
  const res = await fetch('/api/insights')
  const json = await res.json()
  if (!res.ok || !json.ok) throw new Error(json.error?.message ?? 'Error al obtener insights')
  return json.data
}

export function useInsights() {
  return useQuery({
    queryKey: ['insights'],
    queryFn: fetchInsights,
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}
