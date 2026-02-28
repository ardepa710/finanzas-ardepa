/**
 * Unusual spending detection alert rules engine
 * Detects when daily spending exceeds 50% above 30-day average
 */

import { prisma } from '@/lib/prisma'
import { AlertToCreate } from './presupuesto-alerts'

/**
 * Check for unusual spending patterns
 */
export async function checkGastoInusualAlerts(): Promise<AlertToCreate[]> {
  const alerts: AlertToCreate[] = []

  // Get today's date range
  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endOfToday = new Date(startOfToday)
  endOfToday.setDate(endOfToday.getDate() + 1)

  // Get spending for today
  const gastosHoy = await prisma.gasto.aggregate({
    where: {
      fecha: {
        gte: startOfToday,
        lt: endOfToday,
      },
    },
    _sum: { monto: true },
  })

  const gastoHoy = Number(gastosHoy._sum.monto || 0)

  // If no spending today, nothing to check
  if (gastoHoy === 0) {
    return alerts
  }

  // Get average daily spending for last 30 days (excluding today)
  const thirtyDaysAgo = new Date(startOfToday)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const gastosPasados = await prisma.gasto.aggregate({
    where: {
      fecha: {
        gte: thirtyDaysAgo,
        lt: startOfToday,
      },
    },
    _sum: { monto: true },
  })

  const totalPasado = Number(gastosPasados._sum.monto || 0)

  // Count actual days with spending data to avoid inflated averages for new users
  const diasConDatos = await prisma.gasto.groupBy({
    by: ['fecha'],
    where: {
      fecha: {
        gte: thirtyDaysAgo,
        lt: startOfToday,
      },
    },
  })

  // Use actual days with data (or 30 if more data exists, or 1 minimum to avoid division by zero)
  const diasReales = Math.max(diasConDatos.length, 1)
  const promedioDiario = totalPasado / diasReales

  // If no historical data, can't compare
  if (promedioDiario === 0) {
    return alerts
  }

  // Check if today's spending is 50%+ above average
  const porcentajeSobrePromedio = ((gastoHoy - promedioDiario) / promedioDiario) * 100

  if (porcentajeSobrePromedio >= 50) {
    // Check if we already alerted today
    const exists = await alertExistsToday()

    if (!exists) {
      alerts.push({
        tipo: 'GASTO_INUSUAL',
        titulo: 'Gasto inusual detectado',
        mensaje: `Hoy has gastado $${gastoHoy.toFixed(2)}, un ${porcentajeSobrePromedio.toFixed(0)}% más que tu promedio diario de $${promedioDiario.toFixed(2)}.`,
        prioridad: 'NORMAL',
        metadata: {
          gastoHoy: gastoHoy,
          promedioDiario: promedioDiario,
          porcentajeSobrePromedio: porcentajeSobrePromedio,
          fecha: startOfToday.toISOString(),
        },
      })
    }
  }

  return alerts
}

/**
 * Check if a GASTO_INUSUAL alert already exists for today
 */
async function alertExistsToday(): Promise<boolean> {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const existing = await prisma.notificacion.findFirst({
    where: {
      tipo: 'GASTO_INUSUAL',
      createdAt: { gte: startOfDay },
    },
  })

  return existing !== null
}
