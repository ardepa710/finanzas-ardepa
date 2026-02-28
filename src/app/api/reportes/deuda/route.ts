/**
 * GET /api/reportes/deuda - Debt evolution over time
 */

import { withErrorHandling, APIError, ErrorCodes } from '@/lib/api-error'
import { generateDeudaReport } from '@/features/reportes/services/report-generator'

export const GET = withErrorHandling(async (req: Request) => {
  const { searchParams } = new URL(req.url)
  const inicio = searchParams.get('inicio')
  const fin = searchParams.get('fin')

  // Validate required params
  if (!inicio || !fin) {
    throw new APIError(
      ErrorCodes.VALIDATION_ERROR,
      'Se requieren fechas inicio y fin',
      400
    )
  }

  // Parse and validate dates
  const inicioDate = new Date(inicio)
  const finDate = new Date(fin)

  if (isNaN(inicioDate.getTime()) || isNaN(finDate.getTime())) {
    throw new APIError(ErrorCodes.VALIDATION_ERROR, 'Fechas inválidas', 400)
  }

  // Validate range
  if (finDate < inicioDate) {
    throw new APIError(
      ErrorCodes.VALIDATION_ERROR,
      'La fecha fin debe ser posterior a la fecha inicio',
      400
    )
  }

  const report = await generateDeudaReport({
    inicio: inicioDate,
    fin: finDate,
  })

  return report
})
