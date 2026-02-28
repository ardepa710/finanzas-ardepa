/**
 * Tests for Alert Rules Engine
 * Test all business rules for automatic notification generation
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'
import { checkPresupuestoAlerts } from '@/features/alertas/engine/presupuesto-alerts'
import { checkCreditoAlerts } from '@/features/alertas/engine/credito-alerts'
import { checkGastoInusualAlerts } from '@/features/alertas/engine/gasto-alerts'
import { runAllAlertRules } from '@/features/alertas/engine/alert-rules'

describe('Alert Rules Engine', () => {
  let categoriaId: string
  let presupuestoId: string
  let creditoId: string

  beforeAll(async () => {
    // Get or create a test category
    const categoria = await prisma.categoria.findFirst({
      where: { tipo: 'GASTO' },
    })
    categoriaId = categoria!.id
  })

  afterEach(async () => {
    // Clean up test data
    await prisma.notificacion.deleteMany({})
    await prisma.gasto.deleteMany({})
    await prisma.presupuesto.deleteMany({})
    await prisma.credito.deleteMany({})
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('Presupuesto Alerts', () => {
    it('creates PRESUPUESTO_80 alert when budget at 80%', async () => {
      // Create a monthly budget of $1000
      const presupuesto = await prisma.presupuesto.create({
        data: {
          categoriaId,
          monto: 1000,
          periodo: 'MENSUAL',
          alertaEn80: true,
          alertaEn90: false,
          alertaEn100: false,
        },
      })

      // Create gastos totaling $800 (80%)
      await prisma.gasto.create({
        data: {
          categoriaId,
          monto: 800,
          descripcion: 'Test gasto',
          fecha: new Date(),
        },
      })

      // Run alert check
      const alerts = await checkPresupuestoAlerts()

      // Should create one alert
      expect(alerts).toHaveLength(1)
      expect(alerts[0].tipo).toBe('PRESUPUESTO_80')
      expect(alerts[0].prioridad).toBe('NORMAL')
      expect(alerts[0].metadata.presupuestoId).toBe(presupuesto.id)
      expect(alerts[0].metadata.porcentaje).toBe(80)
    })

    it('creates PRESUPUESTO_90 alert when budget at 90%', async () => {
      const presupuesto = await prisma.presupuesto.create({
        data: {
          categoriaId,
          monto: 1000,
          periodo: 'MENSUAL',
          alertaEn90: true,
        },
      })

      await prisma.gasto.create({
        data: {
          categoriaId,
          monto: 900,
          descripcion: 'Test gasto',
          fecha: new Date(),
        },
      })

      const alerts = await checkPresupuestoAlerts()

      expect(alerts).toHaveLength(1)
      expect(alerts[0].tipo).toBe('PRESUPUESTO_90')
      expect(alerts[0].prioridad).toBe('ALTA')
    })

    it('creates PRESUPUESTO_100 alert when budget exceeded', async () => {
      const presupuesto = await prisma.presupuesto.create({
        data: {
          categoriaId,
          monto: 1000,
          periodo: 'MENSUAL',
          alertaEn100: true,
        },
      })

      await prisma.gasto.create({
        data: {
          categoriaId,
          monto: 1100,
          descripcion: 'Test gasto',
          fecha: new Date(),
        },
      })

      const alerts = await checkPresupuestoAlerts()

      expect(alerts).toHaveLength(1)
      expect(alerts[0].tipo).toBe('PRESUPUESTO_100')
      expect(alerts[0].prioridad).toBe('URGENTE')
    })

    it('does not create duplicate alerts for same budget and period', async () => {
      const presupuesto = await prisma.presupuesto.create({
        data: {
          categoriaId,
          monto: 1000,
          periodo: 'MENSUAL',
          alertaEn80: true,
        },
      })

      await prisma.gasto.create({
        data: {
          categoriaId,
          monto: 800,
          descripcion: 'Test gasto',
          fecha: new Date(),
        },
      })

      // First check - should create alert
      const alerts1 = await checkPresupuestoAlerts()
      expect(alerts1).toHaveLength(1)

      // Create the notification
      await prisma.notificacion.create({
        data: alerts1[0],
      })

      // Second check - should not create duplicate
      const alerts2 = await checkPresupuestoAlerts()
      expect(alerts2).toHaveLength(0)
    })

    it('respects alert toggle flags', async () => {
      const presupuesto = await prisma.presupuesto.create({
        data: {
          categoriaId,
          monto: 1000,
          periodo: 'MENSUAL',
          alertaEn80: false, // Disabled
        },
      })

      await prisma.gasto.create({
        data: {
          categoriaId,
          monto: 800,
          descripcion: 'Test gasto',
          fecha: new Date(),
        },
      })

      const alerts = await checkPresupuestoAlerts()

      // Should not create alert because flag is disabled
      expect(alerts).toHaveLength(0)
    })
  })

  describe('Credito Alerts', () => {
    it('creates CREDITO_PROXIMO alert when payment due in 3 days', async () => {
      // Create credit with payment due in 3 days
      const threeDaysFromNow = new Date()
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

      const credito = await prisma.credito.create({
        data: {
          nombre: 'Test Credit',
          tipo: 'TARJETA',
          montoTotal: 10000,
          saldoActual: 5000,
          pagoMensual: 500,
          diaPago: threeDaysFromNow.getDate(),
          frecuencia: 'MENSUAL',
          activo: true,
        },
      })

      const alerts = await checkCreditoAlerts()

      expect(alerts).toHaveLength(1)
      expect(alerts[0].tipo).toBe('CREDITO_PROXIMO')
      expect(alerts[0].prioridad).toBe('ALTA')
      expect(alerts[0].metadata.creditoId).toBe(credito.id)
      expect(alerts[0].metadata.diasRestantes).toBeLessThanOrEqual(3)
    })

    it('creates CREDITO_VENCIDO alert when payment overdue', async () => {
      // Use SEMANAL frequency with fechaBase 10 days ago
      // Next payment would be 3 days ago (10 - 7 = 3 days overdue)
      const tenDaysAgo = new Date()
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10)

      const credito = await prisma.credito.create({
        data: {
          nombre: 'Test Credit',
          tipo: 'PRESTAMO',
          montoTotal: 10000,
          saldoActual: 5000,
          pagoMensual: 500,
          diaPago: 1, // Not used for SEMANAL
          frecuencia: 'SEMANAL',
          fechaBase: tenDaysAgo,
          activo: true,
        },
      })

      const alerts = await checkCreditoAlerts()

      expect(alerts).toHaveLength(1)
      expect(alerts[0].tipo).toBe('CREDITO_VENCIDO')
      expect(alerts[0].prioridad).toBe('URGENTE')
      expect(alerts[0].metadata.creditoId).toBe(credito.id)
      expect(alerts[0].metadata.diasVencido).toBeGreaterThan(0)
    })

    it('does not create duplicate alerts for same credit today', async () => {
      const threeDaysFromNow = new Date()
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

      const credito = await prisma.credito.create({
        data: {
          nombre: 'Test Credit',
          tipo: 'TARJETA',
          montoTotal: 10000,
          saldoActual: 5000,
          pagoMensual: 500,
          diaPago: threeDaysFromNow.getDate(),
          frecuencia: 'MENSUAL',
          activo: true,
        },
      })

      // First check
      const alerts1 = await checkCreditoAlerts()
      expect(alerts1).toHaveLength(1)

      // Create notification
      await prisma.notificacion.create({
        data: alerts1[0],
      })

      // Second check - should not create duplicate
      const alerts2 = await checkCreditoAlerts()
      expect(alerts2).toHaveLength(0)
    })

    it('does not alert for inactive credits', async () => {
      const threeDaysFromNow = new Date()
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

      await prisma.credito.create({
        data: {
          nombre: 'Inactive Credit',
          tipo: 'TARJETA',
          montoTotal: 10000,
          saldoActual: 0,
          pagoMensual: 500,
          diaPago: threeDaysFromNow.getDate(),
          frecuencia: 'MENSUAL',
          activo: false, // Inactive
        },
      })

      const alerts = await checkCreditoAlerts()

      // Should not alert for inactive credits
      expect(alerts).toHaveLength(0)
    })
  })

  describe('Gasto Inusual Alerts', () => {
    it('creates GASTO_INUSUAL alert when spending 50%+ above average', async () => {
      // Create historical spending data (30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      // Average $100/day for 30 days = $3000 total
      for (let i = 0; i < 30; i++) {
        const fecha = new Date(thirtyDaysAgo)
        fecha.setDate(fecha.getDate() + i)

        await prisma.gasto.create({
          data: {
            categoriaId,
            monto: 100,
            descripcion: `Historical gasto ${i}`,
            fecha,
          },
        })
      }

      // Today spend $200 (100% above average of $100)
      await prisma.gasto.create({
        data: {
          categoriaId,
          monto: 200,
          descripcion: 'Today large gasto',
          fecha: new Date(),
        },
      })

      const alerts = await checkGastoInusualAlerts()

      expect(alerts).toHaveLength(1)
      expect(alerts[0].tipo).toBe('GASTO_INUSUAL')
      expect(alerts[0].prioridad).toBe('NORMAL')
      expect(alerts[0].metadata.gastoHoy).toBe(200)
      expect(alerts[0].metadata.promedioDiario).toBe(100)
      expect(alerts[0].metadata.porcentajeSobrePromedio).toBeGreaterThanOrEqual(50)
    })

    it('does not alert when spending is normal', async () => {
      // Create historical spending
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      for (let i = 0; i < 30; i++) {
        const fecha = new Date(thirtyDaysAgo)
        fecha.setDate(fecha.getDate() + i)

        await prisma.gasto.create({
          data: {
            categoriaId,
            monto: 100,
            descripcion: `Historical gasto ${i}`,
            fecha,
          },
        })
      }

      // Today spend $120 (only 20% above average)
      await prisma.gasto.create({
        data: {
          categoriaId,
          monto: 120,
          descripcion: 'Today normal gasto',
          fecha: new Date(),
        },
      })

      const alerts = await checkGastoInusualAlerts()

      // Should not alert (below 50% threshold)
      expect(alerts).toHaveLength(0)
    })

    it('does not alert when no spending today', async () => {
      // Create historical spending
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      for (let i = 0; i < 30; i++) {
        const fecha = new Date(thirtyDaysAgo)
        fecha.setDate(fecha.getDate() + i)

        await prisma.gasto.create({
          data: {
            categoriaId,
            monto: 100,
            descripcion: `Historical gasto ${i}`,
            fecha,
          },
        })
      }

      // No spending today
      const alerts = await checkGastoInusualAlerts()

      expect(alerts).toHaveLength(0)
    })
  })

  describe('Master Rules Registry', () => {
    it('runs all rules and creates notifications in bulk', async () => {
      // Setup: Create a budget violation
      await prisma.presupuesto.create({
        data: {
          categoriaId,
          monto: 1000,
          periodo: 'MENSUAL',
          alertaEn80: true,
        },
      })

      await prisma.gasto.create({
        data: {
          categoriaId,
          monto: 800,
          descripcion: 'Test gasto',
          fecha: new Date(),
        },
      })

      // Run all rules
      const result = await runAllAlertRules()

      // Should report statistics
      expect(result.created).toBeGreaterThan(0)
      expect(result.presupuesto).toBe(1)

      // Verify notifications were created in DB
      const notifications = await prisma.notificacion.findMany()
      expect(notifications.length).toBe(result.created)
    })

    it('handles when no alerts are triggered', async () => {
      // No data setup - no alerts should trigger
      const result = await runAllAlertRules()

      expect(result.created).toBe(0)
      expect(result.presupuesto).toBe(0)
      expect(result.credito).toBe(0)
      expect(result.ahorro).toBe(0)
      expect(result.gastoInusual).toBe(0)
    })
  })
})
