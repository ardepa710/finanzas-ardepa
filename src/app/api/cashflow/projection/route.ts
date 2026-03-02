/**
 * API Route: GET /api/cashflow/projection
 * Projects future cashflow for next N months
 */


import { projectCashflow } from '@/features/cashflow/calculators/projection'
import { withErrorHandling, APIError, ErrorCodes } from '@/lib/api-error'

export const GET = withErrorHandling(async (req: Request) => {
  const { searchParams } = new URL(req.url)

  // Parse query parameters
  const mesesParam = searchParams.get('meses')
  const balanceInicialParam = searchParams.get('balanceInicial')

  const meses = mesesParam ? parseInt(mesesParam, 10) : 6
  const balanceInicial = balanceInicialParam ? parseFloat(balanceInicialParam) : 0

  // Validate meses
  if (isNaN(meses) || meses < 1 || meses > 12) {
    throw new APIError(ErrorCodes.VALIDATION_ERROR, 'meses debe estar entre 1 y 12')
  }

  // Validate balanceInicial
  if (isNaN(balanceInicial)) {
    throw new APIError(ErrorCodes.VALIDATION_ERROR, 'balanceInicial debe ser un número válido')
  }

  // Calculate projection
  const projection = await projectCashflow(meses, balanceInicial)

  return projection
})
