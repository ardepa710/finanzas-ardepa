/**
 * Types for deuda feature - Debt payoff strategies
 */

export interface MonthlyPayment {
  mes: number
  deuda: string // nombre del crédito
  pago: number
  interes: number
  principal: number
  saldoRestante: number
}

export interface StrategyResult {
  orden: string[] // Order of payoff (debt names in order they'll be paid off)
  timeline: MonthlyPayment[] // Month-by-month payment breakdown
  totalPagado: number // Total amount paid (principal + interest)
  totalIntereses: number // Total interest paid
  mesesLibertad: number // Months to complete debt freedom
}
