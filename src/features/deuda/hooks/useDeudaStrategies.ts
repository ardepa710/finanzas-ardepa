/**
 * React Query hooks for Debt Strategies
 */

import { useQuery } from '@tanstack/react-query'
import type { StrategyResult } from '../types'

interface StrategyResponse {
  orden: string[]
  timeline: any[]
  totalPagado: number
  totalIntereses: number
  mesesLibertad: number
  metadata?: {
    totalCreditosActivos: number
    pagoMensualMinimo: number
    pagoMensualTotal: number
    calculadoEn: string
  }
}

interface Credito {
  id: string
  nombre: string
  saldoActual: number | string
  pagoMensual: number | string
  tasaInteres: number | string | null
  activo: boolean
}

export function useSnowballStrategy(pagoExtra: number) {
  return useQuery({
    queryKey: ['snowball-strategy', pagoExtra],
    queryFn: async () => {
      const res = await fetch(`/api/deuda/snowball?pagoExtra=${pagoExtra}`)
      const json = await res.json()

      if (!res.ok || !json.ok) {
        throw new Error(json.error?.message || 'Error al calcular estrategia Snowball')
      }

      return json.data as StrategyResponse
    },
    enabled: pagoExtra > 0,
  })
}

export function useAvalancheStrategy(pagoExtra: number) {
  return useQuery({
    queryKey: ['avalanche-strategy', pagoExtra],
    queryFn: async () => {
      const res = await fetch(`/api/deuda/avalanche?pagoExtra=${pagoExtra}`)
      const json = await res.json()

      if (!res.ok || !json.ok) {
        throw new Error(json.error?.message || 'Error al calcular estrategia Avalanche')
      }

      return json.data as StrategyResponse
    },
    enabled: pagoExtra > 0,
  })
}

export function useActiveCreditos() {
  return useQuery({
    queryKey: ['creditos-activos'],
    queryFn: async () => {
      const res = await fetch('/api/creditos?activo=true')
      const json = await res.json()

      if (!res.ok || !json.ok) {
        throw new Error(json.error?.message || 'Error al obtener créditos activos')
      }

      return json.data as Credito[]
    },
  })
}

interface ComparisonResult {
  snowball: StrategyResponse
  avalanche: StrategyResponse
  winner: 'snowball' | 'avalanche'
  savings: number
}

export function useCompareStrategies(pagoExtra: number) {
  const snowball = useSnowballStrategy(pagoExtra)
  const avalanche = useAvalancheStrategy(pagoExtra)

  return useQuery({
    queryKey: ['compare-strategies', pagoExtra],
    queryFn: async () => {
      if (!snowball.data || !avalanche.data) {
        throw new Error('Ambas estrategias deben estar cargadas')
      }

      const winner =
        snowball.data.totalIntereses < avalanche.data.totalIntereses
          ? 'snowball'
          : 'avalanche'

      const savings = Math.abs(
        snowball.data.totalIntereses - avalanche.data.totalIntereses
      )

      return {
        snowball: snowball.data,
        avalanche: avalanche.data,
        winner,
        savings,
      } as ComparisonResult
    },
    enabled: snowball.isSuccess && avalanche.isSuccess && pagoExtra > 0,
  })
}
