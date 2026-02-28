/**
 * Types for cashflow projection feature
 */

export interface IncomeEvent {
  nombre: string
  monto: number
  fecha: Date
}

export interface MonthProjection {
  mes: number              // 1-6
  fecha: Date              // First day of month
  nombreMes: string        // "Marzo 2026"
  ingresos: {
    total: number
    fuentes: IncomeEvent[]
  }
  gastos: {
    total: number
    fijos: number          // Debt payments
    variables: number      // Estimated from historical average
    desglose: {
      deudas: number
      promedioDiario: number
    }
  }
  flujoNeto: number        // ingresos.total - gastos.total
  balanceAcumulado: number // Running balance
}

export interface CashflowProjection {
  proyecciones: MonthProjection[]
  resumen: {
    totalIngresos: number
    totalGastos: number
    flujoNetoTotal: number
    balanceFinal: number
    promedioMensual: {
      ingresos: number
      gastos: number
      flujoNeto: number
    }
  }
}
