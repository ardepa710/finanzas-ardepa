import { prisma } from '@/lib/prisma'
import { withErrorHandling, APIError, ErrorCodes } from '@/lib/api-error'
import { transaccionInversionSchema } from '@/shared/validations/schemas'

export const POST = withErrorHandling(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id: inversionId } = await params
    const body = await req.json()
    const result = transaccionInversionSchema.safeParse(body)

    if (!result.success) {
      throw new APIError(ErrorCodes.VALIDATION_ERROR, result.error.issues[0].message)
    }

    // Validate investment exists
    const inversion = await prisma.inversion.findUnique({
      where: { id: inversionId },
    })

    if (!inversion) {
      throw new APIError(ErrorCodes.NOT_FOUND, 'Inversión no encontrada', 404)
    }

    const { tipo, monto, fecha, descripcion } = result.data

    // Create transaction
    const transaccion = await prisma.transaccionInversion.create({
      data: {
        inversionId,
        tipo,
        monto,
        fecha: new Date(fecha),
        descripcion,
      },
    })

    return transaccion
  }
)
