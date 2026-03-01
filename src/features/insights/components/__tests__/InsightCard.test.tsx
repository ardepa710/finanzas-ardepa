import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import InsightCard from '../InsightCard'
import type { InsightGenerado } from '../../types'

const mockInsight: InsightGenerado = {
  tipo: 'ALERTA',
  titulo: 'DTI muy alto',
  descripcion: 'Tu ratio deuda-ingreso es 45%.',
  accion: 'Aumenta el pago de tu crédito mayor.',
  prioridad: 5,
  datos: { dti: 45 }
}

describe('InsightCard', () => {
  it('renders titulo and descripcion', () => {
    render(<InsightCard insight={mockInsight} />)
    expect(screen.getByText('DTI muy alto')).toBeDefined()
    expect(screen.getByText(/Tu ratio deuda-ingreso/)).toBeDefined()
  })

  it('renders emoji icon for ALERTA type', () => {
    render(<InsightCard insight={mockInsight} />)
    expect(screen.getByText('🚨')).toBeDefined()
  })

  it('renders accion text', () => {
    render(<InsightCard insight={mockInsight} />)
    expect(screen.getByText(/Aumenta el pago/)).toBeDefined()
  })

  it('shows urgente badge for prioridad 5', () => {
    render(<InsightCard insight={mockInsight} />)
    expect(screen.getByText(/urgente/i)).toBeDefined()
  })

  it('renders OPORTUNIDAD icon for OPORTUNIDAD type', () => {
    render(<InsightCard insight={{ ...mockInsight, tipo: 'OPORTUNIDAD' }} />)
    expect(screen.getByText('💡')).toBeDefined()
  })
})
