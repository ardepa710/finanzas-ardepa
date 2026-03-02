import { withErrorHandling, APIError, ErrorCodes } from '@/lib/api-error'
import { proyeccionLargoPlazoQuerySchema } from '@/shared/validations/schemas'
import { calcularProyeccionLargoPlazo } from '@/features/proyeccion/calculators/long-term-projection'
import { ZodError } from 'zod'

export const GET = withErrorHandling(async (req: Request) => {
  const { searchParams } = new URL(req.url)

  try {
    // Validate query parameters
    const params = proyeccionLargoPlazoQuerySchema.parse({
      años: searchParams.get('años') || '5',
      balanceInicial: searchParams.get('balanceInicial') || '0',
    })

    // Calculate projection
    const proyeccion = await calcularProyeccionLargoPlazo(
      params.años,
      params.balanceInicial
    )

    return { proyeccion }
  } catch (error) {
    if (error instanceof ZodError) {
      const messages = error.issues.map((e: { message: string }) => e.message).join(', ') || 'Validation error'
      throw new APIError(
        ErrorCodes.VALIDATION_ERROR,
        messages,
        400
      )
    }
    throw error
  }
})
