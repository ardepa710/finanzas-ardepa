/**
 * Tests for ProgressBar component
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import ProgressBar from './ProgressBar'

describe('ProgressBar', () => {
  it('should render with label and percentage', () => {
    render(React.createElement(ProgressBar, { percentage: 50, label: 'Test Progress' }))
    expect(screen.getByText('Test Progress')).toBeTruthy()
    expect(screen.getByText('50.0%')).toBeTruthy()
  })

  it('should clamp percentage to 100', () => {
    render(React.createElement(ProgressBar, { percentage: 150, label: 'Over 100' }))
    expect(screen.getByText('100.0%')).toBeTruthy()
  })

  it('should clamp percentage to 0', () => {
    render(React.createElement(ProgressBar, { percentage: -10, label: 'Negative' }))
    expect(screen.getByText('0.0%')).toBeTruthy()
  })

  it('should render without label', () => {
    render(React.createElement(ProgressBar, { percentage: 75 }))
    expect(screen.queryByText('75.0%')).toBe(null) // No label, no percentage text shown
  })
})
