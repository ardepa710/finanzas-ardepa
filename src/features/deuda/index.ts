/**
 * Deuda Feature - Debt Payoff Strategies
 *
 * Export all public APIs for debt payoff calculations
 */

export { calculateSnowball } from './calculators/snowball'
export { calculateAvalanche } from './calculators/avalanche'
export type { MonthlyPayment, StrategyResult } from './types'
