/**
 * Tests for StrategyCard Component
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StrategyCard from './StrategyCard'

describe('StrategyCard', () => {
  const mockSnowballResult = {
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
  }

  const mockAvalancheResult = {
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
  }

  it('should render Snowball strategy card', () => {
    render(
      <StrategyCard
        strategy="snowball"
        result={mockSnowballResult}
        isWinner={false}
      />
    )

    expect(screen.getByText('❄️')).toBeDefined()
    expect(screen.getByText('Snowball')).toBeDefined()
    expect(screen.getByText('Pagar primero el balance más pequeño')).toBeDefined()
  })

  it('should render Avalanche strategy card', () => {
    render(
      <StrategyCard
        strategy="avalanche"
        result={mockAvalancheResult}
        isWinner={false}
      />
    )

    expect(screen.getByText('⚡')).toBeDefined()
    expect(screen.getByText('Avalanche')).toBeDefined()
    expect(screen.getByText('Pagar primero el interés más alto')).toBeDefined()
  })

  it('should display winner badge when isWinner is true', () => {
    render(
      <StrategyCard
        strategy="avalanche"
        result={mockAvalancheResult}
        isWinner={true}
      />
    )

    expect(screen.getByText('🏆')).toBeDefined()
    expect(screen.getByText('Ahorra más')).toBeDefined()
  })

  it('should not display winner badge when isWinner is false', () => {
    render(
      <StrategyCard
        strategy="snowball"
        result={mockSnowballResult}
        isWinner={false}
      />
    )

    expect(screen.queryByText('🏆')).toBeNull()
  })

  it('should display months to freedom', () => {
    render(
      <StrategyCard
        strategy="snowball"
        result={mockSnowballResult}
        isWinner={false}
      />
    )

    expect(screen.getByText('16')).toBeDefined()
    expect(screen.getByText('Meses hasta libertad')).toBeDefined()
  })

  it('should display total paid', () => {
    render(
      <StrategyCard
        strategy="snowball"
        result={mockSnowballResult}
        isWinner={false}
      />
    )

    expect(screen.getByText('$5,950')).toBeDefined()
  })

  it('should display total interest', () => {
    render(
      <StrategyCard
        strategy="snowball"
        result={mockSnowballResult}
        isWinner={false}
      />
    )

    expect(screen.getByText('$450')).toBeDefined()
  })

  it('should display savings when winner with other result', () => {
    render(
      <StrategyCard
        strategy="avalanche"
        result={mockAvalancheResult}
        isWinner={true}
        otherResult={mockSnowballResult}
      />
    )

    // Savings = 450 - 356 = 94
    expect(screen.getByText('$94')).toBeDefined()
  })

  it('should display payoff order', () => {
    render(
      <StrategyCard
        strategy="snowball"
        result={mockSnowballResult}
        isWinner={false}
      />
    )

    expect(screen.getAllByText('Orden de pago:').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Tarjeta/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Préstamo/).length).toBeGreaterThan(0)
  })
})
