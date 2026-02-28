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

  const report = await generateDeudaReport({
    inicio: inicioDate,
    fin: finDate,
  })

  // Add disclaimer about limitations
  return {
    data: report,
    warnings: [
      'Este reporte muestra el estado actual de deudas, no su evolución histórica dentro del período seleccionado.',
      'Los valores de deuda inicial y pagos totales son aproximaciones basadas en el saldo actual.',
      'Los intereses pagados son estimaciones y pueden no reflejar los valores reales.',
    ],
  }
})
