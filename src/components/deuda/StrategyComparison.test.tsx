/**
 * Tests for StrategyComparison Component
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StrategyComparison from './StrategyComparison'

describe('StrategyComparison', () => {
  const mockSnowballResult = {
    orden: ['Tarjeta', 'Préstamo'],
    timeline: [],
    totalPagado: 5950,
    totalIntereses: 450,
    mesesLibertad: 16,
  }

  const mockAvalancheResult = {
    orden: ['Tarjeta', 'Préstamo'],
    timeline: [],
    totalPagado: 5856,
    totalIntereses: 356,
    mesesLibertad: 15,
  }

  it('should render both strategy cards', () => {
    render(
      <StrategyComparison
        snowball={mockSnowballResult}
        avalanche={mockAvalancheResult}
      />
    )

    expect(screen.getByText('Snowball')).toBeDefined()
    expect(screen.getByText('Avalanche')).toBeDefined()
  })

  it('should declare Snowball winner when it has lower interest', () => {
    const snowballLower = { ...mockSnowballResult, totalIntereses: 300 }
    const avalancheHigher = { ...mockAvalancheResult, totalIntereses: 400 }

    render(
      <StrategyComparison snowball={snowballLower} avalanche={avalancheHigher} />
    )

    expect(screen.getByText(/❄️ Snowball es la mejor estrategia/)).toBeDefined()
  })

  it('should declare Avalanche winner when it has lower interest', () => {
    render(
      <StrategyComparison
        snowball={mockSnowballResult}
        avalanche={mockAvalancheResult}
      />
    )

    expect(screen.getByText(/⚡ Avalanche es la mejor estrategia/)).toBeDefined()
  })

  it('should display savings amount', () => {
    render(
      <StrategyComparison
        snowball={mockSnowballResult}
        avalanche={mockAvalancheResult}
      />
    )

    // Savings = 450 - 356 = 94
    expect(screen.getByText(/Ahorrarás \$94 en intereses/)).toBeDefined()
  })
})
