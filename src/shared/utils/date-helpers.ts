/**
 * Date utility functions for alert rules engine
 */

import { FrecuenciaPago } from '@/generated/prisma/client'

/**
 * Calculate the number of days between two dates
 */
export function daysBetween(date1: Date, date2: Date): number {
  const diff = date2.getTime() - date1.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/**
 * Get the start of a period (reused from presupuestos/status endpoint)
 */
export function getStartOfPeriod(periodo: string): Date {
  const now = new Date()

  if (periodo === 'MENSUAL') {
    return new Date(now.getFullYear(), now.getMonth(), 1)
  }

  if (periodo === 'QUINCENAL') {
    const day = now.getDate()
    return new Date(now.getFullYear(), now.getMonth(), day <= 15 ? 1 : 16)
  }

  if (periodo === 'SEMANAL') {
    const day = now.getDay()
    const diff = day === 0 ? -6 : 1 - day  // Sunday = 0, Monday = 1
    const monday = new Date(now)
    monday.setDate(now.getDate() + diff)
    monday.setHours(0, 0, 0, 0)
    return monday
  }

  return now
}

/**
 * Calculate the next payment date for a credit based on its frequency
 * For upcoming payments: returns the next due date
 * For overdue payments: returns the missed payment date (in the past)
 */
export function calculateNextPaymentDate(credito: {
  frecuencia: FrecuenciaPago
  diaPago: number
  diaSemana?: number | null
  fechaBase?: Date | null
}): Date {
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Normalize to start of day
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth()

  if (credito.frecuencia === 'MENSUAL') {
    // Calculate this month's payment date
    let thisMonthPayment = new Date(currentYear, currentMonth, credito.diaPago)
    thisMonthPayment.setHours(0, 0, 0, 0)

    // Calculate next month's payment date
    let nextMonthPayment = new Date(currentYear, currentMonth + 1, credito.diaPago)
    nextMonthPayment.setHours(0, 0, 0, 0)

    // If this month's payment is in the future, return it
    if (thisMonthPayment > today) {
      return thisMonthPayment
    }

    // This month's payment is today or in the past
    // Return it if it's within the last 7 days (recent/overdue)
    // Otherwise return next month's payment
    const daysSince = daysBetween(thisMonthPayment, today)

    if (daysSince <= 7) {
      return thisMonthPayment
    } else {
      return nextMonthPayment
    }
  }

  if (credito.frecuencia === 'SEMANAL' && credito.fechaBase) {
    // For weekly payments, find the most recent payment date
    const baseDate = new Date(credito.fechaBase)
    baseDate.setHours(0, 0, 0, 0)

    const daysDiff = daysBetween(baseDate, today)

    // How many complete weeks have passed since baseDate?
    const weeksPassed = Math.floor(daysDiff / 7)

    // The most recent payment date is baseDate + (weeksPassed * 7)
    let paymentDate = new Date(baseDate)
    paymentDate.setDate(baseDate.getDate() + (weeksPassed * 7))

    return paymentDate
  }

  if (credito.frecuencia === 'QUINCENAL' && credito.fechaBase) {
    // For biweekly payments, find the most recent payment date
    const baseDate = new Date(credito.fechaBase)
    baseDate.setHours(0, 0, 0, 0)

    const daysDiff = daysBetween(baseDate, today)

    // How many complete biweeks have passed?
    const biweeksPassed = Math.floor(daysDiff / 14)

    // The most recent payment date
    let paymentDate = new Date(baseDate)
    paymentDate.setDate(baseDate.getDate() + (biweeksPassed * 14))

    return paymentDate
  }

  // Fallback: return tomorrow if unable to calculate
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow
}

/**
 * Get the number of days in a date range
 * @param range Date range
 * @returns Number of days (inclusive)
 */
export function getIntervalDays(range: { inicio: Date; fin: Date }): number {
  return Math.ceil((range.fin.getTime() - range.inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1
}

/**
 * Format a date range for display
 * @param range Date range
 * @returns Formatted string
 */
export function formatDateRange(range: { inicio: Date; fin: Date }): string {
  const inicio = range.inicio.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
  const fin = range.fin.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
  return `${inicio} - ${fin}`
}
