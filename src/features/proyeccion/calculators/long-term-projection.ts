/**
 * Long-term financial projection calculator (1-5 years)
 */

import { prisma } from '@/lib/prisma'
import { normalizeToMonthly } from '@/features/ratios/calculators/helpers'
import type { ProyeccionLargoPlazo, ProyeccionAnual } from '../types'

/**
 * Calculate long-term financial projection
 * @param años Number of years to project (1-5)
 * @param balanceInicial Starting balance (can be negative)
 * @returns Long-term projection data
 */
export async function calcularProyeccionLargoPlazo(
  años: number,
  balanceInicial: number
): Promise<ProyeccionLargoPlazo> {
  const currentYear = new Date().getFullYear()

  // 1. Get current net worth (assets - debts)
  const [activos, creditos] = await Promise.all([
    prisma.activo.findMany({
      where: { activo: true },
    }),
    prisma.credito.findMany({
      where: { activo: true },
    }),
  ])

  const totalActivos = activos.reduce(
    (sum, activo) => sum + Number(activo.valorActual),
    0
  )

  const totalPasivos = creditos.reduce(
    (sum, credito) => sum + Number(credito.saldoActual),
    0
  )

  const patrimonioNetoInicial = totalActivos - totalPasivos + balanceInicial

  // 2. Calculate annual income (normalize all frequencies to annual)
  const fuentesIngreso = await prisma.fuenteIngreso.findMany({
    where: { activo: true },
  })

  const ingresosAnuales = fuentesIngreso.reduce((total, fuente) => {
    const montoMensual = normalizeToMonthly(Number(fuente.monto), fuente.frecuencia)
    return total + montoMensual * 12
  }, 0)

  // 3. Calculate annual expenses (last 90 days average × 365)
  const today = new Date()
  const ninetyDaysAgo = new Date(today)
  ninetyDaysAgo.setDate(today.getDate() - 90)

  const gastos = await prisma.gasto.findMany({
    where: {
      fecha: {
        gte: ninetyDaysAgo,
        lte: today,
      },
    },
  })

  const totalGastos90Dias = gastos.reduce((sum, gasto) => sum + Number(gasto.monto), 0)
  const gastoDiarioPromedio = gastos.length > 0 ? totalGastos90Dias / 90 : 0
  const gastosAnuales = gastoDiarioPromedio * 365

  // 4. Calculate initial annual debt payment
  const pagoDeudaAnualInicial = creditos.reduce(
    (sum, credito) => sum + Number(credito.pagoMensual) * 12,
    0
  )

  // 5. Project each year
  const proyecciones: ProyeccionAnual[] = []
  let balanceAcumulado = 0
  let deudaRestante = totalPasivos

  for (let i = 0; i < años; i++) {
    const año = currentYear + i

    // Calculate debt payment for this year (0 if debt is paid off)
    const pagoDeudaAnual = deudaRestante > 0 ? pagoDeudaAnualInicial : 0

    // Calculate savings for this year
    const ahorroAnual = ingresosAnuales - gastosAnuales - pagoDeudaAnual

    // Update accumulated balance
    balanceAcumulado += ahorroAnual

    // Calculate net worth for this year
    const patrimonioNeto = patrimonioNetoInicial + balanceAcumulado

    // Update remaining debt (can't be negative)
    deudaRestante = Math.max(0, deudaRestante - pagoDeudaAnualInicial)

    proyecciones.push({
      año,
      ingresosAnuales,
      gastosAnuales,
      pagoDeudaAnual,
      ahorroAnual,
      balanceAcumulado,
      patrimonioNeto,
      deudaRestante,
    })
  }

  // 6. Calculate summary stats
  const patrimonioNetoFinal = proyecciones[proyecciones.length - 1].patrimonioNeto
  const crecimientoTotal = patrimonioNetoFinal - patrimonioNetoInicial
  const crecimientoAnualPromedio = crecimientoTotal / años
  const totalAhorrado = balanceAcumulado
  const deudaEliminada = totalPasivos - proyecciones[proyecciones.length - 1].deudaRestante

  return {
    añoInicial: currentYear,
    proyecciones,
    resumen: {
      patrimonioNetoInicial,
      patrimonioNetoFinal,
      crecimientoTotal,
      crecimientoAnualPromedio,
      totalAhorrado,
      deudaEliminada,
    },
  }
}
