/**
 * Tests for Deuda Strategy hooks
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  useSnowballStrategy,
  useAvalancheStrategy,
  useActiveCreditos,
  useCompareStrategies,
} from './useDeudaStrategies'
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

describe('useSnowballStrategy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch snowball strategy successfully', async () => {
    const mockData = {
      ok: true,
      data: {
        orden: ['Tarjeta', 'Préstamo'],
        timeline: [],
        totalPagado: 5950,
        totalIntereses: 450,
        mesesLibertad: 16,
        metadata: {
          totalCreditosActivos: 2,
          pagoMensualMinimo: 200,
          pagoMensualTotal: 400,
        },
      },
    }

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    })

    const { result } = renderHook(
      () => useSnowballStrategy(200),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockData.data)
    expect(global.fetch).toHaveBeenCalledWith('/api/deuda/snowball?pagoExtra=200')
  })

  it('should handle API error response', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        ok: false,
        error: { message: 'No hay créditos activos' },
      }),
    })

    const { result } = renderHook(
      () => useSnowballStrategy(100),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeTruthy()
  })

  it('should not fetch when pagoExtra is 0', async () => {
    const { result } = renderHook(
      () => useSnowballStrategy(0),
      { wrapper: createWrapper() }
    )

    expect(result.current.fetchStatus).toBe('idle')
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('should not fetch when pagoExtra is negative', async () => {
    const { result } = renderHook(
      () => useSnowballStrategy(-50),
      { wrapper: createWrapper() }
    )

    expect(result.current.fetchStatus).toBe('idle')
    expect(global.fetch).not.toHaveBeenCalled()
  })
})

describe('useAvalancheStrategy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch avalanche strategy successfully', async () => {
    const mockData = {
      ok: true,
      data: {
        orden: ['Tarjeta', 'Préstamo'],
        timeline: [],
        totalPagado: 5856,
        totalIntereses: 356,
        mesesLibertad: 15,
        metadata: {
          totalCreditosActivos: 2,
          pagoMensualMinimo: 200,
          pagoMensualTotal: 400,
        },
      },
    }

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    })

    const { result } = renderHook(
      () => useAvalancheStrategy(200),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockData.data)
    expect(global.fetch).toHaveBeenCalledWith('/api/deuda/avalanche?pagoExtra=200')
  })
})

describe('useActiveCreditos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch active creditos successfully', async () => {
    const mockData = {
      ok: true,
      data: [
        {
          id: '1',
          nombre: 'Tarjeta',
          saldoActual: 800,
          pagoMensual: 100,
          tasaInteres: 18,
          activo: true,
        },
        {
          id: '2',
          nombre: 'Préstamo',
          saldoActual: 5000,
          pagoMensual: 100,
          tasaInteres: 12,
          activo: true,
        },
      ],
    }

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    })

    const { result } = renderHook(
      () => useActiveCreditos(),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockData.data)
    expect(global.fetch).toHaveBeenCalledWith('/api/creditos?activo=true')
  })

  it('should handle empty active creditos', async () => {
    const mockData = {
      ok: true,
      data: [],
    }

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    })

    const { result } = renderHook(
      () => useActiveCreditos(),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual([])
  })
})

describe('useCompareStrategies', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should determine snowball as winner when it has lower interest', () => {
    const mockSnowball = {
      ok: true,
      data: {
        orden: ['Tarjeta'],
        timeline: [],
        totalPagado: 5800,
        totalIntereses: 300,
        mesesLibertad: 15,
      },
    }

    const mockAvalanche = {
      ok: true,
      data: {
        orden: ['Tarjeta'],
        timeline: [],
        totalPagado: 5900,
        totalIntereses: 400,
        mesesLibertad: 15,
      },
    }

    let fetchCount = 0
    ;(global.fetch as any).mockImplementation(() => {
      fetchCount++
      return Promise.resolve({
        ok: true,
        json: async () => (fetchCount === 1 ? mockSnowball : mockAvalanche),
      })
    })

    const { result } = renderHook(
      () => useCompareStrategies(200),
      { wrapper: createWrapper() }
    )

    waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
      expect(result.current.data?.winner).toBe('snowball')
      expect(result.current.data?.savings).toBe(100)
    })
  })

  it('should determine avalanche as winner when it has lower interest', () => {
    const mockSnowball = {
      ok: true,
      data: {
        orden: ['Tarjeta'],
        timeline: [],
        totalPagado: 5900,
        totalIntereses: 400,
        mesesLibertad: 15,
      },
    }

    const mockAvalanche = {
      ok: true,
      data: {
        orden: ['Tarjeta'],
        timeline: [],
        totalPagado: 5800,
        totalIntereses: 300,
        mesesLibertad: 14,
      },
    }

    let fetchCount = 0
    ;(global.fetch as any).mockImplementation(() => {
      fetchCount++
      return Promise.resolve({
        ok: true,
        json: async () => (fetchCount === 1 ? mockSnowball : mockAvalanche),
      })
    })

    const { result } = renderHook(
      () => useCompareStrategies(200),
      { wrapper: createWrapper() }
    )

    waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
      expect(result.current.data?.winner).toBe('avalanche')
      expect(result.current.data?.savings).toBe(100)
    })
  })

  it('should not fetch when pagoExtra is 0', async () => {
    const { result } = renderHook(
      () => useCompareStrategies(0),
      { wrapper: createWrapper() }
    )

    expect(result.current.fetchStatus).toBe('idle')
    expect(global.fetch).not.toHaveBeenCalled()
  })
})
