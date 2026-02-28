/**
 * Period comparison utilities for reports
 */

import type { DateRange } from './report-generator'

export interface PeriodData {
  range: DateRange
  value: number
}

export interface Comparison {
  actual: number
  anterior: number
  cambio: number
  cambioPorcentaje: number
}

/**
 * Calculate the previous period with same duration
 * @param range Current period date range
 * @returns Previous period date range
 */
export function getPreviousPeriod(range: DateRange): DateRange {
  const duration = range.fin.getTime() - range.inicio.getTime()

  return {
    inicio: new Date(range.inicio.getTime() - duration),
    fin: new Date(range.inicio.getTime()),
  }
}

/**
 * Compare two periods and calculate change
 * @param current Current period data
 * @param previous Previous period data
 * @returns Comparison with absolute and percentage change
 */
export function comparePeriods(
  current: PeriodData,
  previous: PeriodData
): Comparison {
  const cambio = current.value - previous.value

  let cambioPorcentaje = 0
  if (previous.value !== 0) {
    cambioPorcentaje = (cambio / previous.value) * 100
  } else if (current.value > 0) {
    cambioPorcentaje = 100
  }

  return {
    actual: current.value,
    anterior: previous.value,
    cambio,
    cambioPorcentaje,
  }
}

/**
 * Format comparison for display
 * @param comparison Comparison object
 * @returns Formatted strings for UI
 */
export function formatComparison(comparison: Comparison): {
  cambioTexto: string
  tendencia: 'positiva' | 'negativa' | 'neutral'
} {
  const { cambio, cambioPorcentaje } = comparison

  const signo = cambio > 0 ? '+' : ''
  const cambioTexto = `${signo}${cambio.toFixed(2)} (${signo}${cambioPorcentaje.toFixed(1)}%)`

  let tendencia: 'positiva' | 'negativa' | 'neutral' = 'neutral'
  if (Math.abs(cambioPorcentaje) > 10) {
    tendencia = cambio > 0 ? 'positiva' : 'negativa'
  }

  return {
    cambioTexto,
    tendencia,
  }
}
