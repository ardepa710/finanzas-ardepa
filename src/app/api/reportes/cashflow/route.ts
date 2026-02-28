/**
 * GET /api/reportes/cashflow - Cashflow analysis by period
 */

import { withErrorHandling, APIError, ErrorCodes } from '@/lib/api-error'
import { generateCashflowReport } from '@/features/reportes/services/report-generator'

export const GET = withErrorHandling(async (req: Request) => {
  const { searchParams } = new URL(req.url)
  const periodo = searchParams.get('periodo') || 'mensual'

  // Validate periodo
  const validPeriodos = ['mensual', 'semanal', 'quincenal']
  if (!validPeriodos.includes(periodo)) {
    throw new APIError(
      ErrorCodes.VALIDATION_ERROR,
      'Periodo inválido. Use: mensual, semanal o quincenal',
      400
    )
  }

  const report = await generateCashflowReport(periodo as 'mensual' | 'semanal' | 'quincenal')

  return report
})
