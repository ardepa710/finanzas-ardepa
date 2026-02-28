/**
 * Trend detection and analysis service
 */

export type Tendencia = 'subida' | 'bajada' | 'estable'

/**
 * Detect trend by comparing current vs previous value
 * @param current Current period value
 * @param previous Previous period value
 * @returns Trend direction (subida > 10%, bajada < -10%, estable otherwise)
 */
export function detectTrend(current: number, previous: number): Tendencia {
  // Handle edge cases
  if (previous === 0 && current === 0) return 'estable'
  if (previous === 0) return 'subida'
  if (current === 0) return 'bajada'

  const change = ((current - previous) / previous) * 100

  if (change >= 10) return 'subida'
  if (change <= -10) return 'bajada'
  return 'estable'
}

/**
 * Analyze trend from an array of data points
 * Uses simple comparison between first and last values
 * @param dataPoints Array of numeric values over time
 * @returns Trend analysis with direction and percentage change
 */
export function analyzeTrend(dataPoints: number[]): {
  tendencia: Tendencia
  porcentajeCambio: number
} {
  // Handle edge cases
  if (dataPoints.length === 0) {
    return { tendencia: 'estable', porcentajeCambio: 0 }
  }

  if (dataPoints.length === 1) {
    return { tendencia: 'estable', porcentajeCambio: 0 }
  }

  // Compare first and last values
  const first = dataPoints[0]
  const last = dataPoints[dataPoints.length - 1]

  // Calculate percentage change
  let porcentajeCambio = 0
  if (first !== 0) {
    porcentajeCambio = ((last - first) / first) * 100
  } else if (last > 0) {
    porcentajeCambio = 100
  }

  const tendencia = detectTrend(last, first)

  return {
    tendencia,
    porcentajeCambio,
  }
}

/**
 * Get human-readable label for trend
 */
export function getTrendLabel(trend: Tendencia): string {
  const labels = {
    subida: 'En aumento',
    bajada: 'En descenso',
    estable: 'Estable',
  }
  return labels[trend]
}
