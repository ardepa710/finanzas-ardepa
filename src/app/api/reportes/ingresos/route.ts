/**
 * GET /api/reportes/ingresos - Income vs Expenses comparison
 */

import { withErrorHandling, APIError, ErrorCodes } from '@/lib/api-error'
import { generateIngresosReport } from '@/features/reportes/services/report-generator'

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

  // Parse and validate dates (explicit UTC to avoid timezone issues)
  const inicioDate = new Date(inicio + 'T00:00:00Z')
  const finDate = new Date(fin + 'T23:59:59Z')

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

  const report = await generateIngresosReport({
    inicio: inicioDate,
    fin: finDate,
  })

  return report
})
