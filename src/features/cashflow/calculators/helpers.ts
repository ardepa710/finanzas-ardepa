/**
 * Helper functions for cashflow projection
 */

import { FuenteIngreso, FrecuenciaPago, Gasto } from '@/generated/prisma/client'
import { IncomeEvent } from '../types'
import { prisma } from '@/lib/prisma'

/**
 * Add days to a date
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Start of day (normalize to 00:00:00.000)
 */
function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/**
 * Get first day of month N months from now
 */
export function getMonthStart(monthsFromNow: number): Date {
  const today = new Date()
  const targetMonth = today.getMonth() + monthsFromNow
  const targetYear = today.getFullYear() + Math.floor(targetMonth / 12)
  const normalizedMonth = targetMonth % 12
  return new Date(targetYear, normalizedMonth, 1)
}

/**
 * Get last day of month
 */
export function getMonthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}

/**
 * Get number of days in a month
 */
export function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

/**
 * Format month name in Spanish
 */
export function formatMonthName(date: Date): string {
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`
}

/**
 * Calculate occurrences of recurring income in date range
 */
export function calculateIncomeOccurrences(
  fuente: FuenteIngreso,
  startDate: Date,
  endDate: Date
): IncomeEvent[] {
  const occurrences: IncomeEvent[] = []
  const start = startOfDay(startDate)
  const end = startOfDay(endDate)

  if (fuente.frecuencia === 'MENSUAL') {
    if (fuente.diaMes === null) {
      throw new Error(`FuenteIngreso MENSUAL "${fuente.nombre}" requiere diaMes`)
    }

    // Calculate months in range
    let currentDate = new Date(start)
    while (currentDate <= end) {
      // Create payment date for this month
      const paymentDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        fuente.diaMes
      )

      // Check if payment date falls within range
      if (paymentDate >= start && paymentDate <= end) {
        occurrences.push({
          nombre: fuente.nombre,
          monto: fuente.monto.toNumber(),
          fecha: paymentDate
        })
      }

      // Move to next month
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    }

    return occurrences
  }

  if (fuente.frecuencia === 'QUINCENAL') {
    if (!fuente.fechaBase) {
      throw new Error(`FuenteIngreso QUINCENAL "${fuente.nombre}" requiere fechaBase`)
    }

    let currentDate = startOfDay(fuente.fechaBase)

    // Fast-forward to start of range if fechaBase is before
    while (currentDate < start) {
      currentDate = addDays(currentDate, 14)
    }

    // Generate occurrences every 14 days
    while (currentDate <= end) {
      occurrences.push({
        nombre: fuente.nombre,
        monto: fuente.monto.toNumber(),
        fecha: new Date(currentDate)
      })
      currentDate = addDays(currentDate, 14)
    }

    return occurrences
  }

  if (fuente.frecuencia === 'SEMANAL') {
    if (!fuente.fechaBase) {
      throw new Error(`FuenteIngreso SEMANAL "${fuente.nombre}" requiere fechaBase`)
    }

    let currentDate = startOfDay(fuente.fechaBase)

    // Fast-forward to start of range if fechaBase is before
    while (currentDate < start) {
      currentDate = addDays(currentDate, 7)
    }

    // Generate occurrences every 7 days
    while (currentDate <= end) {
      occurrences.push({
        nombre: fuente.nombre,
        monto: fuente.monto.toNumber(),
        fecha: new Date(currentDate)
      })
      currentDate = addDays(currentDate, 7)
    }

    return occurrences
  }

  return occurrences
}

/**
 * Get daily expense average from last N days
 * Uses historical Gasto data
 */
export async function getDailyExpenseAverage(days: number = 90): Promise<number> {
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - days)

  const gastos = await prisma.gasto.findMany({
    where: {
      fecha: {
        gte: startDate,
        lte: today
      }
    },
    select: {
      monto: true
    }
  })

  if (gastos.length === 0) {
    return 0
  }

  const total = gastos.reduce((sum, g) => sum + g.monto, 0)
  return total / days
}
