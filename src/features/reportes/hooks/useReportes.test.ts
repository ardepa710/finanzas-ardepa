/**
 * Tests for Reportes hooks
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useGastosReport, useIngresosReport, useDeudaReport, useCashflowReport } from './useReportes'
import React, { type ReactNode } from 'react'

// Mock fetch globally
global.fetch = vi.fn()

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useGastosReport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch gastos report successfully', async () => {
    const mockData = {
      ok: true,
      data: {
        periodo: { inicio: '2026-02-01', fin: '2026-02-28' },
        total: 1500,
        promedio: 50,
        porCategoria: [
          { categoria: 'Comida', monto: 600, porcentaje: 40, tendencia: 'subida' },
          { categoria: 'Transporte', monto: 400, porcentaje: 27, tendencia: 'estable' },
        ],
        tendenciaGeneral: 'subida',
      },
    }

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    })

    const { result } = renderHook(
      () => useGastosReport('2026-02-01', '2026-02-28'),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockData.data)
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/reportes/gastos?inicio=2026-02-01&fin=2026-02-28'
    )
  })

  it('should handle API error response', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        ok: false,
        error: { message: 'Error al generar reporte' },
      }),
    })

    const { result } = renderHook(
      () => useGastosReport('2026-02-01', '2026-02-28'),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeTruthy()
  })

  it('should not fetch without both dates', async () => {
    const { result } = renderHook(
      () => useGastosReport('', ''),
      { wrapper: createWrapper() }
    )

    expect(result.current.fetchStatus).toBe('idle')
    expect(global.fetch).not.toHaveBeenCalled()
  })
})

describe('useIngresosReport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch ingresos report successfully', async () => {
    const mockData = {
      ok: true,
      data: {
        periodo: { inicio: '2026-02-01', fin: '2026-02-28' },
        totalIngresos: 3000,
        totalGastos: 1500,
        balance: 1500,
        porcentajeAhorro: 50,
        recomendaciones: ['Buen ritmo de ahorro'],
      },
    }

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    })

    const { result } = renderHook(
      () => useIngresosReport('2026-02-01', '2026-02-28'),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockData.data)
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/reportes/ingresos?inicio=2026-02-01&fin=2026-02-28'
    )
  })
})

describe('useDeudaReport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch deuda report with warnings', async () => {
    const mockData = {
      ok: true,
      data: {
        report: {
          total: 5000,
          pagado: 1000,
          pendiente: 4000,
          porcentajePagado: 20,
        },
        warnings: ['Deuda alta', 'Vencimientos próximos'],
      },
    }

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    })

    const { result } = renderHook(
      () => useDeudaReport('2026-02-01', '2026-02-28'),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockData.data)
    expect(result.current.data.warnings).toHaveLength(2)
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/reportes/deuda?inicio=2026-02-01&fin=2026-02-28'
    )
  })
})

describe('useCashflowReport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch cashflow report by period', async () => {
    const mockData = {
      ok: true,
      data: {
        periodo: 'mensual',
        periodos: [
          { periodo: '2026-02', ingresos: 3000, gastos: 1500, neto: 1500, balanceAcumulado: 1500 },
          { periodo: '2026-01', ingresos: 2800, gastos: 1400, neto: 1400, balanceAcumulado: 1400 },
        ],
        totales: { ingresos: 5800, gastos: 2900, neto: 2900 },
      },
    }

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    })

    const { result } = renderHook(
      () => useCashflowReport('mensual'),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockData.data)
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/reportes/cashflow?periodo=mensual'
    )
  })

  it('should not fetch without period', async () => {
    const { result } = renderHook(
      () => useCashflowReport(''),
      { wrapper: createWrapper() }
    )

    expect(result.current.fetchStatus).toBe('idle')
    expect(global.fetch).not.toHaveBeenCalled()
  })
})
