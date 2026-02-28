/**
 * Core report generation service
 */

import { prisma } from '@/lib/prisma'
import { detectTrend, type Tendencia } from './trend-analyzer'
import { getPreviousPeriod } from './comparator'
import { getIntervalDays } from '@/shared/utils/date-helpers'

export interface DateRange {
  inicio: Date
  fin: Date
}

export interface CategoriaGasto {
  categoria: string
  monto: number
  porcentaje: number
  tendencia: Tendencia
}

export interface ReporteGastos {
  periodo: DateRange
  total: number
  promedio: number
  porCategoria: CategoriaGasto[]
  tendenciaGeneral: Tendencia
}

export interface ReporteIngresos {
  periodo: DateRange
  totalIngresos: number
  totalGastos: number
  balance: number
  tasaAhorro: number
  porFuente: Array<{
    fuente: string
    monto: number
    porcentaje: number
  }>
  porCategoriaGasto: Array<{
    categoria: string
    monto: number
    porcentaje: number
  }>
}

export interface ReporteDeuda {
  periodo: DateRange
  deudaTotal: number
  deudaInicial: number
  pagosTotales: number
  interesesPagados: number
  porCredito: Array<{
    nombre: string
    saldoActual: number
    saldoInicial: number
    pagoMensual: number
    progreso: number
  }>
}

export interface PeriodoCashflow {
  periodo: string
  inicio: Date
  fin: Date
  ingresos: number
  gastos: number
  neto: number
  balance: number
}

export interface ReporteCashflow {
  periodos: PeriodoCashflow[]
  totalIngresos: number
  totalGastos: number
  netoTotal: number
  balanceFinal: number
}

/**
 * Generate expense report with category breakdown and trends
 */
export async function generateGastosReport(range: DateRange): Promise<ReporteGastos> {
  // Get current period expenses grouped by category
  const gastosActuales = await prisma.gasto.groupBy({
    by: ['categoriaId'],
    where: {
      fecha: {
        gte: range.inicio,
        lte: range.fin,
      },
    },
    _sum: {
      monto: true,
    },
  })

  // Get category names
  const categoriaIds = gastosActuales.map((g: any) => g.categoriaId)
  const categorias = await prisma.categoria.findMany({
    where: {
      id: {
        in: categoriaIds,
      },
    },
    select: {
      id: true,
      nombre: true,
    },
  })

  const categoriaMap = new Map(categorias.map((c: any) => [c.id, c.nombre]))

  // Calculate total
  const total = gastosActuales.reduce(
    (sum: number, g) => sum + (g._sum.monto ? Number(g._sum.monto) : 0),
    0
  )

  // Get previous period for trend analysis
  const previousRange = getPreviousPeriod(range)
  const gastosPrevios = await prisma.gasto.groupBy({
    by: ['categoriaId'],
    where: {
      fecha: {
        gte: previousRange.inicio,
        lte: previousRange.fin,
      },
    },
    _sum: {
      monto: true,
    },
  })

  const previousMap = new Map(
    gastosPrevios.map((g: any) => [g.categoriaId, Number(g._sum.monto || 0)])
  )

  // Build category breakdown with trends
  const porCategoria: CategoriaGasto[] = gastosActuales
    .map((g: any) => {
      const monto = Number(g._sum.monto || 0)
      const categoria = categoriaMap.get(g.categoriaId) || 'Sin categoría'
      const porcentaje = total > 0 ? (monto / total) * 100 : 0
      const montoPrevio = previousMap.get(g.categoriaId) || 0
      const tendencia = detectTrend(monto, montoPrevio)

      return {
        categoria,
        monto,
        porcentaje: Math.round(porcentaje),
        tendencia,
      }
    })
    .sort((a: any, b: any) => b.monto - a.monto)

  // Calculate overall trend
  const totalPrevio = gastosPrevios.reduce(
    (sum: number, g: any) => sum + (g._sum.monto ? Number(g._sum.monto) : 0),
    0
  )
  const tendenciaGeneral = detectTrend(total, totalPrevio)

  // Calculate daily average
  const days = getIntervalDays(range)
  const promedio = days > 0 ? total / days : 0

  return {
    periodo: range,
    total,
    promedio,
    porCategoria,
    tendenciaGeneral,
  }
}

/**
 * Generate income vs expenses comparison report
 */
export async function generateIngresosReport(range: DateRange): Promise<ReporteIngresos> {
  // Get total income
  const ingresosResult = await prisma.ingresoManual.aggregate({
    where: {
      fecha: {
        gte: range.inicio,
        lte: range.fin,
      },
    },
    _sum: {
      monto: true,
    },
  })

  const totalIngresos = Number(ingresosResult._sum.monto || 0)

  // Get total expenses
  const gastosResult = await prisma.gasto.aggregate({
    where: {
      fecha: {
        gte: range.inicio,
        lte: range.fin,
      },
    },
    _sum: {
      monto: true,
    },
  })

  const totalGastos = Number(gastosResult._sum.monto || 0)

  // Calculate balance and savings rate
  const balance = totalIngresos - totalGastos
  const tasaAhorro = totalIngresos > 0 ? (balance / totalIngresos) * 100 : 0

  // Get income by source
  const ingresosPorFuente = await prisma.ingresoManual.groupBy({
    by: ['fuenteId'],
    where: {
      fecha: {
        gte: range.inicio,
        lte: range.fin,
      },
    },
    _sum: {
      monto: true,
    },
  })

  // Get fuente names
  const fuenteIds = ingresosPorFuente
    .filter((i) => i.fuenteId !== null)
    .map((i) => i.fuenteId as string)

  const fuentes = await prisma.fuenteIngreso.findMany({
    where: {
      id: {
        in: fuenteIds,
      },
    },
    select: {
      id: true,
      nombre: true,
    },
  })

  const fuenteMap = new Map(fuentes.map((f: any) => [f.id, f.nombre]))

  const porFuente = ingresosPorFuente.map((i: any) => {
    const monto = Number(i._sum.monto || 0)
    const fuente = i.fuenteId ? fuenteMap.get(i.fuenteId) || 'Sin fuente' : 'Manual'
    const porcentaje = totalIngresos > 0 ? (monto / totalIngresos) * 100 : 0

    return {
      fuente,
      monto,
      porcentaje: Math.round(porcentaje),
    }
  })

  // Get expenses by category
  const gastosPorCategoria = await prisma.gasto.groupBy({
    by: ['categoriaId'],
    where: {
      fecha: {
        gte: range.inicio,
        lte: range.fin,
      },
    },
    _sum: {
      monto: true,
    },
  })

  const categoriaIds = gastosPorCategoria.map((g) => g.categoriaId)
  const categorias = await prisma.categoria.findMany({
    where: {
      id: {
        in: categoriaIds,
      },
    },
    select: {
      id: true,
      nombre: true,
    },
  })

  const categoriaMap = new Map(categorias.map((c) => [c.id, c.nombre]))

  const porCategoriaGasto = gastosPorCategoria.map((g: any) => {
    const monto = Number(g._sum.monto || 0)
    const categoria = categoriaMap.get(g.categoriaId) || 'Sin categoría'
    const porcentaje = totalGastos > 0 ? (monto / totalGastos) * 100 : 0

    return {
      categoria,
      monto,
      porcentaje: Math.round(porcentaje),
    }
  })

  return {
    periodo: range,
    totalIngresos,
    totalGastos,
    balance,
    tasaAhorro: Math.round(tasaAhorro),
    porFuente,
    porCategoriaGasto,
  }
}

/**
 * Generate debt evolution report
 */
export async function generateDeudaReport(range: DateRange): Promise<ReporteDeuda> {
  // Get all active credits
  const creditos = await prisma.credito.findMany({
    where: {
      activo: true,
    },
  })

  const deudaTotal = creditos.reduce((sum: number, c: any) => sum + Number(c.saldoActual), 0)

  // Calculate initial debt (this is an approximation)
  // In a real scenario, you'd track historical balances
  const deudaInicial = creditos.reduce((sum: number, c: any) => sum + Number(c.montoTotal), 0)

  // Calculate total payments made (approximation)
  const pagosTotales = deudaInicial - deudaTotal

  // Calculate interest paid (approximation based on tasa interes)
  const interesesPagados = creditos.reduce((sum: number, c: any) => {
    if (c.tasaInteres) {
      const principal = Number(c.montoTotal) - Number(c.saldoActual)
      const interesAprox = principal * (Number(c.tasaInteres) / 100) * 0.5 // Rough estimate
      return sum + interesAprox
    }
    return sum
  }, 0)

  // Build per-credit breakdown
  const porCredito = creditos.map((c: any) => {
    const saldoActual = Number(c.saldoActual)
    const saldoInicial = Number(c.montoTotal)
    const pagado = saldoInicial - saldoActual
    const progreso = saldoInicial > 0 ? (pagado / saldoInicial) * 100 : 0

    return {
      nombre: c.nombre,
      saldoActual,
      saldoInicial,
      pagoMensual: Number(c.pagoMensual),
      progreso: Math.round(progreso),
    }
  })

  return {
    periodo: range,
    deudaTotal,
    deudaInicial,
    pagosTotales,
    interesesPagados: Math.round(interesesPagados),
    porCredito,
  }
}

/**
 * Generate cashflow analysis by period
 */
export async function generateCashflowReport(
  periodo: 'mensual' | 'semanal' | 'quincenal'
): Promise<ReporteCashflow> {
  // Get all income and expenses (last 6 months for context)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const ingresos = await prisma.ingresoManual.findMany({
    where: {
      fecha: {
        gte: sixMonthsAgo,
      },
    },
    orderBy: {
      fecha: 'asc',
    },
  })

  const gastos = await prisma.gasto.findMany({
    where: {
      fecha: {
        gte: sixMonthsAgo,
      },
    },
    orderBy: {
      fecha: 'asc',
    },
  })

  // Group by period
  const periodoMap = new Map<string, PeriodoCashflow>()

  const getPeriodKey = (date: Date): string => {
    if (periodo === 'mensual') {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    } else if (periodo === 'semanal') {
      // Get ISO week number
      const week = getWeekNumber(date)
      return `${date.getFullYear()}-W${String(week).padStart(2, '0')}`
    } else {
      // quincenal
      const day = date.getDate()
      const quincena = day <= 15 ? '1' : '2'
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-Q${quincena}`
    }
  }

  // Process income
  ingresos.forEach((ingreso: any) => {
    const key = getPeriodKey(ingreso.fecha)
    if (!periodoMap.has(key)) {
      periodoMap.set(key, {
        periodo: key,
        inicio: ingreso.fecha,
        fin: ingreso.fecha,
        ingresos: 0,
        gastos: 0,
        neto: 0,
        balance: 0,
      })
    }
    const period = periodoMap.get(key)!
    period.ingresos += Number(ingreso.monto)
  })

  // Process expenses
  gastos.forEach((gasto: any) => {
    const key = getPeriodKey(gasto.fecha)
    if (!periodoMap.has(key)) {
      periodoMap.set(key, {
        periodo: key,
        inicio: gasto.fecha,
        fin: gasto.fecha,
        ingresos: 0,
        gastos: 0,
        neto: 0,
        balance: 0,
      })
    }
    const period = periodoMap.get(key)!
    period.gastos += Number(gasto.monto)
  })

  // Calculate net and running balance
  let runningBalance = 0
  const periodos = Array.from(periodoMap.values())
    .sort((a, b) => a.periodo.localeCompare(b.periodo))
    .map((p) => {
      p.neto = p.ingresos - p.gastos
      runningBalance += p.neto
      p.balance = runningBalance
      return p
    })

  const totalIngresos = periodos.reduce((sum, p) => sum + p.ingresos, 0)
  const totalGastos = periodos.reduce((sum, p) => sum + p.gastos, 0)
  const netoTotal = totalIngresos - totalGastos
  const balanceFinal = runningBalance

  return {
    periodos,
    totalIngresos,
    totalGastos,
    netoTotal,
    balanceFinal,
  }
}

/**
 * Get ISO week number for a date
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}
