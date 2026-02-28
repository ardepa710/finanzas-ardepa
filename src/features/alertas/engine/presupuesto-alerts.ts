/**
 * Budget alert rules engine
 * Generates alerts when budgets reach 80%, 90%, or 100% thresholds
 */

import { prisma } from '@/lib/prisma'
import { TipoNotificacion, Prioridad, PeriodoPresupuesto } from '@/generated/prisma/client'
import { getStartOfPeriod } from '@/shared/utils/date-helpers'

export interface AlertToCreate {
  tipo: TipoNotificacion
  titulo: string
  mensaje: string
  prioridad: Prioridad
  metadata: Record<string, any>
}

/**
 * Check all active budgets for threshold violations
 */
export async function checkPresupuestoAlerts(): Promise<AlertToCreate[]> {
  const alerts: AlertToCreate[] = []

  // Get all active budgets across all periods
  const periodos: PeriodoPresupuesto[] = ['SEMANAL', 'QUINCENAL', 'MENSUAL']

  for (const periodo of periodos) {
    const presupuestos = await prisma.presupuesto.findMany({
      where: {
        activo: true,
        periodo: periodo,
      },
      include: { categoria: true },
    })

    // Calculate spent amount for each budget
    const inicio = getStartOfPeriod(periodo)
    const fin = new Date()

    // Get all gastos for this period grouped by category
    const gastosAgrupados = await prisma.gasto.groupBy({
      by: ['categoriaId'],
      where: {
        fecha: { gte: inicio, lte: fin },
        categoriaId: { in: presupuestos.map(p => p.categoriaId) },
      },
      _sum: { monto: true },
    })

    // Create a map for O(1) lookups
    const gastadoPorCategoria = new Map(
      gastosAgrupados.map(g => [g.categoriaId, Number(g._sum.monto || 0)])
    )

    // Check each budget for threshold violations
    for (const presupuesto of presupuestos) {
      const gastado = gastadoPorCategoria.get(presupuesto.categoriaId) || 0
      const limite = Number(presupuesto.monto)

      // Skip zero-amount budgets (invalid configuration)
      if (limite === 0) continue

      const porcentaje = limite > 0 ? (gastado / limite) * 100 : 0

      // Check 100% threshold
      if (porcentaje >= 100 && presupuesto.alertaEn100) {
        const exists = await alertExists(
          presupuesto.id,
          periodo,
          'PRESUPUESTO_100'
        )

        if (!exists) {
          alerts.push({
            tipo: 'PRESUPUESTO_100',
            titulo: `Presupuesto excedido: ${presupuesto.categoria.nombre}`,
            mensaje: `Has gastado $${gastado.toFixed(2)} de $${limite.toFixed(2)} (${porcentaje.toFixed(0)}%) en ${presupuesto.categoria.nombre} este ${periodo.toLowerCase()}.`,
            prioridad: 'URGENTE',
            metadata: {
              presupuestoId: presupuesto.id,
              categoriaId: presupuesto.categoriaId,
              categoriaNombre: presupuesto.categoria.nombre,
              periodo: periodo,
              gastado: gastado,
              limite: limite,
              porcentaje: porcentaje,
            },
          })
        }
      }
      // Check 90% threshold
      else if (porcentaje >= 90 && presupuesto.alertaEn90) {
        const exists = await alertExists(
          presupuesto.id,
          periodo,
          'PRESUPUESTO_90'
        )

        if (!exists) {
          alerts.push({
            tipo: 'PRESUPUESTO_90',
            titulo: `Presupuesto al 90%: ${presupuesto.categoria.nombre}`,
            mensaje: `Has gastado $${gastado.toFixed(2)} de $${limite.toFixed(2)} (${porcentaje.toFixed(0)}%) en ${presupuesto.categoria.nombre} este ${periodo.toLowerCase()}.`,
            prioridad: 'ALTA',
            metadata: {
              presupuestoId: presupuesto.id,
              categoriaId: presupuesto.categoriaId,
              categoriaNombre: presupuesto.categoria.nombre,
              periodo: periodo,
              gastado: gastado,
              limite: limite,
              porcentaje: porcentaje,
            },
          })
        }
      }
      // Check 80% threshold
      else if (porcentaje >= 80 && presupuesto.alertaEn80) {
        const exists = await alertExists(
          presupuesto.id,
          periodo,
          'PRESUPUESTO_80'
        )

        if (!exists) {
          alerts.push({
            tipo: 'PRESUPUESTO_80',
            titulo: `Presupuesto al 80%: ${presupuesto.categoria.nombre}`,
            mensaje: `Has gastado $${gastado.toFixed(2)} de $${limite.toFixed(2)} (${porcentaje.toFixed(0)}%) en ${presupuesto.categoria.nombre} este ${periodo.toLowerCase()}.`,
            prioridad: 'NORMAL',
            metadata: {
              presupuestoId: presupuesto.id,
              categoriaId: presupuesto.categoriaId,
              categoriaNombre: presupuesto.categoria.nombre,
              periodo: periodo,
              gastado: gastado,
              limite: limite,
              porcentaje: porcentaje,
            },
          })
        }
      }
    }
  }

  return alerts
}

/**
 * Check if an alert already exists for this budget and period
 */
async function alertExists(
  presupuestoId: string,
  periodo: string,
  tipo: TipoNotificacion
): Promise<boolean> {
  const inicio = getStartOfPeriod(periodo)

  const existing = await prisma.notificacion.findFirst({
    where: {
      tipo: tipo,
      createdAt: { gte: inicio },
      metadata: {
        path: ['presupuestoId'],
        equals: presupuestoId,
      },
    },
  })

  return existing !== null
}
