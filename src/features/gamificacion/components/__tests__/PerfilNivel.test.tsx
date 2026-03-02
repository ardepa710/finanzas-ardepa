import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PerfilNivel from '../PerfilNivel'

const mockPerfil = {
  nivelActual: 3,
  nivelNombre: 'Organizado',
  xpTotal: 350,
  xpSiguiente: 500,
  progresoPct: 70,
}

describe('PerfilNivel', () => {
  it('renders nivel nombre', () => {
    render(<PerfilNivel perfil={mockPerfil} />)
    expect(screen.getByText('Organizado')).toBeDefined()
  })

  it('renders nivel number', () => {
    render(<PerfilNivel perfil={mockPerfil} />)
    expect(screen.getByText(/nivel 3/i)).toBeDefined()
  })

  it('renders XP total', () => {
    render(<PerfilNivel perfil={mockPerfil} />)
    expect(screen.getByText(/350/)).toBeDefined()
  })

  it('renders progress bar', () => {
    render(<PerfilNivel perfil={mockPerfil} />)
    const bar = screen.getByTestId('xp-bar')
    expect(bar).not.toBeNull()
  })
})
