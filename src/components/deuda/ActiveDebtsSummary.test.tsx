/**
 * Tests for ActiveDebtsSummary Component
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ActiveDebtsSummary from './ActiveDebtsSummary'

describe('ActiveDebtsSummary', () => {
  it('should render empty state when no debts', () => {
    render(<ActiveDebtsSummary creditos={[]} />)

    expect(
      screen.getByText('No tienes deudas activas registradas')
    ).toBeDefined()
    expect(screen.getByText('Agregar Crédito')).toBeDefined()
  })

  it('should render summary with single debt', () => {
    const creditos = [
      {
        id: '1',
        nombre: 'Tarjeta',
        saldoActual: 800,
        pagoMensual: 100,
        tasaInteres: 18,
        activo: true,
      },
    ]

    render(<ActiveDebtsSummary creditos={creditos} />)

    expect(screen.getByText('Deudas Activas')).toBeDefined()
    expect(screen.getByText('1 crédito activos')).toBeDefined()
    expect(screen.getByText('Tarjeta')).toBeDefined()
    expect(screen.getByText('Balance Total')).toBeDefined()
  })

  it('should render summary with multiple debts', () => {
    const creditos = [
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
    ]

    render(<ActiveDebtsSummary creditos={creditos} />)

    expect(screen.getByText('2 créditos activos')).toBeDefined()
    expect(screen.getByText('Tarjeta')).toBeDefined()
    expect(screen.getByText('Préstamo')).toBeDefined()
  })

  it('should calculate correct total balance', () => {
    const creditos = [
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
    ]

    render(<ActiveDebtsSummary creditos={creditos} />)

    expect(screen.getByText('$5,800')).toBeDefined()
  })

  it('should calculate correct minimum payment', () => {
    const creditos = [
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
        pagoMensual: 150,
        tasaInteres: 12,
        activo: true,
      },
    ]

    render(<ActiveDebtsSummary creditos={creditos} />)

    expect(screen.getByText('$250')).toBeDefined()
  })

  it('should display interest rate when available', () => {
    const creditos = [
      {
        id: '1',
        nombre: 'Tarjeta',
        saldoActual: 800,
        pagoMensual: 100,
        tasaInteres: 18.5,
        activo: true,
      },
    ]

    render(<ActiveDebtsSummary creditos={creditos} />)

    expect(screen.getByText('18.5% anual')).toBeDefined()
  })

  it('should handle null interest rate gracefully', () => {
    const creditos = [
      {
        id: '1',
        nombre: 'Préstamo sin interés',
        saldoActual: 1000,
        pagoMensual: 100,
        tasaInteres: null,
        activo: true,
      },
    ]

    render(<ActiveDebtsSummary creditos={creditos} />)

    expect(screen.getByText('Préstamo sin interés')).toBeDefined()
    expect(screen.queryByText(/% anual/)).toBeNull()
  })
})
