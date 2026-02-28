/**
 * Types for long-term financial projection feature
 */

export interface ProyeccionAnual {
  año: number                    // 2026, 2027, etc.
  ingresosAnuales: number        // From FuenteIngreso (normalized to annual)
  gastosAnuales: number          // Average from historical Gasto × 365
  pagoDeudaAnual: number         // Sum of pagoMensual × 12 for active Creditos
  ahorroAnual: number            // ingresos - gastos - pagoDeuda
  balanceAcumulado: number       // Running total
  patrimonioNeto: number         // Starting net worth + balanceAcumulado
  deudaRestante: number          // Projected remaining debt
}

export interface ProyeccionLargoPlazo {
  añoInicial: number
  proyecciones: ProyeccionAnual[]
  resumen: {
    patrimonioNetoInicial: number
    patrimonioNetoFinal: number
    crecimientoTotal: number
    crecimientoAnualPromedio: number
    totalAhorrado: number
    deudaEliminada: number
  }
}
