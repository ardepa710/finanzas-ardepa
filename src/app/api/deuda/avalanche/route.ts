import { prisma } from '@/lib/prisma'
import { withErrorHandling, APIError, ErrorCodes } from '@/lib/api-error'
import { calculateAvalanche } from '@/features/deuda/calculators/avalanche'

/**
 * GET /api/deuda/avalanche
 *
 * Calculate debt payoff using Avalanche strategy (highest interest rate first)
 *
 * Query params:
 *   - pagoExtra: Additional monthly payment to apply (default: 0)
 *
 * Returns:
 *   - orden: Array of debt names in payoff order
 *   - timeline: Month-by-month payment breakdown
 *   - totalPagado: Total amount paid (principal + interest)
 *   - totalIntereses: Total interest paid
 *   - mesesLibertad: Months until debt-free
 */
export const GET = withErrorHandling(async (req: Request) => {
  const { searchParams } = new URL(req.url)
  const pagoExtraParam = searchParams.get('pagoExtra')

  // Parse and validate pagoExtra
  const pagoExtra = pagoExtraParam ? parseFloat(pagoExtraParam) : 0

  if (isNaN(pagoExtra)) {
    throw new APIError(
      ErrorCodes.VALIDATION_ERROR,
      'El parámetro pagoExtra debe ser un número válido'
    )
  }

  if (pagoExtra < 0) {
    throw new APIError(
      ErrorCodes.VALIDATION_ERROR,
      'El pago extra debe ser mayor o igual a 0'
    )
  }

  // Fetch active credits from database
  const creditos = await prisma.credito.findMany({
    where: {
      activo: true,
      saldoActual: {
        gt: 0, // Only include debts with positive balance
      },
    },
    select: {
      id: true,
      nombre: true,
      saldoActual: true,
      pagoMensual: true,
      tasaInteres: true,
    },
  })

  // Check if there are any active debts
  if (creditos.length === 0) {
    throw new APIError(
      ErrorCodes.VALIDATION_ERROR,
      'No hay créditos activos con saldo pendiente'
    )
  }

  // Convert Decimal to number for calculation
  const creditosData = creditos.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    saldoActual: Number(c.saldoActual),
    pagoMensual: Number(c.pagoMensual),
    tasaInteres: c.tasaInteres ? Number(c.tasaInteres) : null,
  }))

  // Validate that total minimum payments don't exceed available budget
  const totalMinimums = creditosData.reduce(
    (sum, c) => sum + c.pagoMensual,
    0
  )

  // Calculate strategy
  const result = calculateAvalanche(creditosData, pagoExtra)

  // Return result with additional context
  return {
    ...result,
    metadata: {
      totalCreditosActivos: creditos.length,
      pagoMensualMinimo: Math.round(totalMinimums * 100) / 100,
      pagoMensualTotal: Math.round((totalMinimums + pagoExtra) * 100) / 100,
      calculadoEn: new Date().toISOString(),
    },
  }
})
