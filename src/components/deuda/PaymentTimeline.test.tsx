/**
 * Tests for PaymentTimeline Component
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PaymentTimeline from './PaymentTimeline'

describe('PaymentTimeline', () => {
  it('should render timeline header', () => {
    render(<PaymentTimeline orden={['Tarjeta']} mesesTotal={12} />)

    expect(screen.getByText('Cronograma de Pago')).toBeDefined()
    expect(screen.getByText('12 meses')).toBeDefined()
  })

  it('should render debt bars', () => {
    render(<PaymentTimeline orden={['Tarjeta', 'Préstamo']} mesesTotal={24} />)

    expect(screen.getByText('Tarjeta')).toBeDefined()
    expect(screen.getByText('Préstamo')).toBeDefined()
  })

  it('should render payoff order legend', () => {
    render(<PaymentTimeline orden={['Tarjeta', 'Préstamo']} mesesTotal={24} />)

    expect(screen.getByText('Orden de pago:')).toBeDefined()
    expect(screen.getByText('1. Tarjeta')).toBeDefined()
    expect(screen.getByText('2. Préstamo')).toBeDefined()
  })

  it('should display month counts on bars', () => {
    render(<PaymentTimeline orden={['Tarjeta']} mesesTotal={12} />)

    expect(screen.getByText('12m')).toBeDefined()
  })

  it('should handle multiple debts', () => {
    const orden = ['Tarjeta', 'Préstamo', 'Auto']
    render(<PaymentTimeline orden={orden} mesesTotal={30} />)

    expect(screen.getByText('1. Tarjeta')).toBeDefined()
    expect(screen.getByText('2. Préstamo')).toBeDefined()
    expect(screen.getByText('3. Auto')).toBeDefined()
  })
})
