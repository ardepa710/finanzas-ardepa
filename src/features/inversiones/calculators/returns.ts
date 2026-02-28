import type { InversionRanked } from '../types'

/**
 * Calculate absolute return (gain or loss)
 * @param valorActual - Current investment value
 * @param montoInvertido - Original investment amount
 * @returns Absolute return (can be negative)
 */
export function calculateRendimientoTotal(
  valorActual: number,
  montoInvertido: number
): number {
  return valorActual - montoInvertido
}

/**
 * Calculate percentage return
 * @param valorActual - Current investment value
 * @param montoInvertido - Original investment amount
 * @returns Percentage return (can be negative)
 */
export function calculateRendimientoPct(
  valorActual: number,
  montoInvertido: number
): number {
  if (montoInvertido === 0) return 0

  const rendimiento = calculateRendimientoTotal(valorActual, montoInvertido)
  return (rendimiento / montoInvertido) * 100
}

/**
 * Calculate Compound Annual Growth Rate (CAGR)
 * Formula: ((valorActual / montoInvertido) ^ (1 / años)) - 1) * 100
 * @param valorActual - Current investment value
 * @param montoInvertido - Original investment amount
 * @param años - Number of years
 * @returns Annualized return percentage
 */
export function calculateCAGR(
  valorActual: number,
  montoInvertido: number,
  años: number
): number {
  if (años === 0 || montoInvertido === 0) return 0

  const ratio = valorActual / montoInvertido
  const cagr = (Math.pow(ratio, 1 / años) - 1) * 100

  return cagr
}

/**
 * Rank investments by performance (best to worst)
 * @param inversiones - Array of investments with activo data
 * @returns Ranked investments with rank field (1 = best)
 */
export function rankInvestments(
  inversiones: Omit<InversionRanked, 'rank'>[]
): InversionRanked[] {
  if (inversiones.length === 0) return []

  // Sort by rendimientoPct descending
  const sorted = [...inversiones].sort(
    (a, b) => Number(b.rendimientoPct) - Number(a.rendimientoPct)
  )

  // Assign ranks, handling ties
  let currentRank = 1
  let previousPct: number | null = null

  return sorted.map((inversion, index) => {
    const currentPct = Number(inversion.rendimientoPct)

    if (previousPct !== null && currentPct < previousPct) {
      currentRank = index + 1
    }

    previousPct = currentPct

    return {
      ...inversion,
      rank: currentRank,
    }
  })
}
