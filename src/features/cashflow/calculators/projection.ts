/**
 * Cashflow projection calculator
 * Projects future cashflow for next N months based on:
 * - Recurring income (FuenteIngreso)
 * - Debt payments (Credito)
 * - Historical expense averages (Gasto)
 */

import { prisma } from '@/lib/prisma'
import { CashflowProjection, MonthProjection, IncomeEvent } from '../types'
import {
  calculateIncomeOccurrences,
  getDailyExpenseAverage,
  getMonthStart,
  getMonthEnd,
  getDaysInMonth,
  formatMonthName
} from './helpers'

/**
 * Project cashflow for the next N months
 * @param meses Number of months to project (1-12)
 * @param balanceInicial Starting balance
 * @returns Cashflow projection with monthly breakdown and summary
 */
export async function projectCashflow(
  meses: number = 6,
  balanceInicial: number = 0
): Promise<CashflowProjection> {
  // Validate input
  if (meses < 1 || meses > 12) {
    throw new Error('meses debe estar entre 1 y 12')
  }

  // Fetch active income sources
  const fuentes = await prisma.fuenteIngreso.findMany({
    where: {
      activo: true
    }
  })

  // Fetch active credits (for debt payments)
  const creditos = await prisma.credito.findMany({
    where: {
      activo: true
    }
  })

  // Calculate daily expense average from last 90 days
  const dailyExpenseAverage = await getDailyExpenseAverage(90)

  // Generate monthly projections
  const proyecciones: MonthProjection[] = []
  let runningBalance = balanceInicial

  for (let monthOffset = 0; monthOffset < meses; monthOffset++) {
    const monthStart = getMonthStart(monthOffset)
    const monthEnd = getMonthEnd(monthStart)
    const daysInMonth = getDaysInMonth(monthStart)

    // Calculate income for this month
    const incomeEvents: IncomeEvent[] = []
    for (const fuente of fuentes) {
      const occurrences = calculateIncomeOccurrences(fuente, monthStart, monthEnd)
      incomeEvents.push(...occurrences)
    }

    const totalIngresos = incomeEvents.reduce((sum, event) => sum + event.monto, 0)

    // Calculate fixed expenses (debt payments)
    const totalDebtPayments = creditos.reduce((sum, credito) => {
      return sum + credito.pagoMensual.toNumber()
    }, 0)

    // Estimate variable expenses based on daily average
    const estimatedVariableExpenses = dailyExpenseAverage * daysInMonth

    // Total expenses
    const totalGastos = totalDebtPayments + estimatedVariableExpenses

    // Net cashflow
    const flujoNeto = totalIngresos - totalGastos

    // Update running balance
    runningBalance += flujoNeto

    // Create month projection
    proyecciones.push({
      mes: monthOffset + 1,
      fecha: monthStart,
      nombreMes: formatMonthName(monthStart),
      ingresos: {
        total: Math.round(totalIngresos * 100) / 100,
        fuentes: incomeEvents
      },
      gastos: {
        total: Math.round(totalGastos * 100) / 100,
        fijos: Math.round(totalDebtPayments * 100) / 100,
        variables: Math.round(estimatedVariableExpenses * 100) / 100,
        desglose: {
          deudas: Math.round(totalDebtPayments * 100) / 100,
          promedioDiario: Math.round(dailyExpenseAverage * 100) / 100
        }
      },
      flujoNeto: Math.round(flujoNeto * 100) / 100,
      balanceAcumulado: Math.round(runningBalance * 100) / 100
    })
  }

  // Calculate summary
  const totalIngresos = proyecciones.reduce((sum, p) => sum + p.ingresos.total, 0)
  const totalGastos = proyecciones.reduce((sum, p) => sum + p.gastos.total, 0)
  const flujoNetoTotal = totalIngresos - totalGastos

  return {
    proyecciones,
    resumen: {
      totalIngresos: Math.round(totalIngresos * 100) / 100,
      totalGastos: Math.round(totalGastos * 100) / 100,
      flujoNetoTotal: Math.round(flujoNetoTotal * 100) / 100,
      balanceFinal: proyecciones[proyecciones.length - 1]?.balanceAcumulado ?? balanceInicial,
      promedioMensual: {
        ingresos: Math.round((totalIngresos / meses) * 100) / 100,
        gastos: Math.round((totalGastos / meses) * 100) / 100,
        flujoNeto: Math.round((flujoNetoTotal / meses) * 100) / 100
      }
    }
  }
}
