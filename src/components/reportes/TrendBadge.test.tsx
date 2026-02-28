/**
 * Tests for TrendBadge component
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import TrendBadge from './TrendBadge'

describe('TrendBadge', () => {
  it('should render subida trend', () => {
    render(React.createElement(TrendBadge, { tendencia: 'subida' }))
    expect(screen.getByText('Subida')).toBeTruthy()
    expect(screen.getByText('⬆️')).toBeTruthy()
  })

  it('should render bajada trend', () => {
    render(React.createElement(TrendBadge, { tendencia: 'bajada' }))
    expect(screen.getByText('Bajada')).toBeTruthy()
    expect(screen.getByText('⬇️')).toBeTruthy()
  })

  it('should render estable trend', () => {
    render(React.createElement(TrendBadge, { tendencia: 'estable' }))
    expect(screen.getByText('Estable')).toBeTruthy()
    expect(screen.getByText('➡️')).toBeTruthy()
  })
})
