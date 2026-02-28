/**
 * React Query hooks for Reportes
 */

import { useQuery } from '@tanstack/react-query'

export function useGastosReport(inicio: string, fin: string) {
  return useQuery({
    queryKey: ['reportes-gastos', inicio, fin],
    queryFn: async () => {
      const response = await fetch(`/api/reportes/gastos?inicio=${inicio}&fin=${fin}`)
      const json = await response.json()

      if (!response.ok || !json.ok) {
        throw new Error(json.error?.message || 'Error al obtener reporte de gastos')
      }

      return json.data
    },
    enabled: Boolean(inicio && fin),
  })
}

export function useIngresosReport(inicio: string, fin: string) {
  return useQuery({
    queryKey: ['reportes-ingresos', inicio, fin],
    queryFn: async () => {
      const response = await fetch(`/api/reportes/ingresos?inicio=${inicio}&fin=${fin}`)
      const json = await response.json()

      if (!response.ok || !json.ok) {
        throw new Error(json.error?.message || 'Error al obtener reporte de ingresos')
      }

      return json.data
    },
    enabled: Boolean(inicio && fin),
  })
}

export function useDeudaReport(inicio: string, fin: string) {
  return useQuery({
    queryKey: ['reportes-deuda', inicio, fin],
    queryFn: async () => {
      const response = await fetch(`/api/reportes/deuda?inicio=${inicio}&fin=${fin}`)
      const json = await response.json()

      if (!response.ok || !json.ok) {
        throw new Error(json.error?.message || 'Error al obtener reporte de deuda')
      }

      return json.data
    },
    enabled: Boolean(inicio && fin),
  })
}

export function useCashflowReport(periodo: string) {
  return useQuery({
    queryKey: ['reportes-cashflow', periodo],
    queryFn: async () => {
      const response = await fetch(`/api/reportes/cashflow?periodo=${periodo}`)
      const json = await response.json()

      if (!response.ok || !json.ok) {
        throw new Error(json.error?.message || 'Error al obtener reporte de cashflow')
      }

      return json.data
    },
    enabled: Boolean(periodo),
  })
}
