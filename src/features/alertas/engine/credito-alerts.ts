/**
 * Credit payment alert rules engine
 * Generates alerts for upcoming and overdue credit payments
 */

import { prisma } from '@/lib/prisma'
import { TipoNotificacion, Prioridad } from '@/generated/prisma/client'
import { daysBetween, calculateNextPaymentDate } from '@/shared/utils/date-helpers'
import { AlertToCreate } from './presupuesto-alerts'

/**
 * Check all active credits for payment due dates
 */
export async function checkCreditoAlerts(): Promise<AlertToCreate[]> {
  const alerts: AlertToCreate[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Normalize to start of day

  const creditos = await prisma.credito.findMany({
    where: { activo: true },
  })

  for (const credito of creditos) {
    const nextPayment = calculateNextPaymentDate(credito)
    const daysUntil = daysBetween(today, nextPayment)

    // CREDITO_VENCIDO: Payment is overdue (past due date)
    if (daysUntil < 0) {
      const exists = await alertExistsToday(credito.id, 'CREDITO_VENCIDO')

      if (!exists) {
        alerts.push({
          tipo: 'CREDITO_VENCIDO',
          titulo: `Pago vencido: ${credito.nombre}`,
          mensaje: `El pago de ${credito.nombre} venció hace ${Math.abs(daysUntil)} día(s). Monto: $${Number(credito.pagoMensual).toFixed(2)}`,
          prioridad: 'URGENTE',
          metadata: {
            creditoId: credito.id,
            creditoNombre: credito.nombre,
            montoPago: Number(credito.pagoMensual),
            fechaPago: nextPayment.toISOString(),
            diasVencido: Math.abs(daysUntil),
          },
        })
      }
    }
    // CREDITO_PROXIMO: Payment due in 3 days or less (but not overdue)
    else if (daysUntil <= 3 && daysUntil >= 0) {
      const exists = await alertExistsToday(credito.id, 'CREDITO_PROXIMO')

      if (!exists) {
        alerts.push({
          tipo: 'CREDITO_PROXIMO',
          titulo: `Pago próximo: ${credito.nombre}`,
          mensaje: `El pago de ${credito.nombre} vence en ${daysUntil} día(s). Monto: $${Number(credito.pagoMensual).toFixed(2)}`,
          prioridad: 'ALTA',
          metadata: {
            creditoId: credito.id,
            creditoNombre: credito.nombre,
            montoPago: Number(credito.pagoMensual),
            fechaPago: nextPayment.toISOString(),
            diasRestantes: daysUntil,
          },
        })
      }
    }
  }

  return alerts
}

/**
 * Check if an alert already exists for this credit today
 * (We only want one alert per credit per day to avoid spam)
 */
async function alertExistsToday(
  creditoId: string,
  tipo: TipoNotificacion
): Promise<boolean> {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const existing = await prisma.notificacion.findFirst({
    where: {
      tipo: tipo,
      createdAt: { gte: startOfDay },
      metadata: {
        path: ['creditoId'],
        equals: creditoId,
      },
    },
  })

  return existing !== null
}
