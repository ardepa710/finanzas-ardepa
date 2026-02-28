/**
 * TrendBadge - Displays trend indicator with icon and color
 */

import React from 'react'

type Tendencia = 'subida' | 'bajada' | 'estable'

interface TrendBadgeProps {
  tendencia: Tendencia
  className?: string
}

const TREND_CONFIG = {
  subida: {
    icon: '⬆️',
    label: 'Subida',
    color: 'text-green-500',
  },
  bajada: {
    icon: '⬇️',
    label: 'Bajada',
    color: 'text-red-500',
  },
  estable: {
    icon: '➡️',
    label: 'Estable',
    color: 'text-slate-400',
  },
}

export default function TrendBadge({ tendencia, className = '' }: TrendBadgeProps) {
  const config = TREND_CONFIG[tendencia]

  return (
    <span className={`inline-flex items-center gap-1 text-sm font-medium ${config.color} ${className}`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  )
}
