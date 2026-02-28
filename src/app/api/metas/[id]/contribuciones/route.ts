import { prisma } from '@/lib/prisma'
import { withErrorHandling, APIError, ErrorCodes } from '@/lib/api-error'
import { contribucionSchema } from '@/shared/validations/schemas'

export const POST = withErrorHandling(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id: metaId } = await params
  const body = await req.json()
  const result = contribucionSchema.safeParse(body)

  if (!result.success) {
    throw new APIError(ErrorCodes.VALIDATION_ERROR, result.error.issues[0].message)
  }

  const meta = await prisma.meta.findUnique({
    where: { id: metaId },
  })

  if (!meta) {
    throw new APIError(ErrorCodes.NOT_FOUND, 'Meta no encontrada', 404)
  }

  const { fecha, ...contribucionData } = result.data

  // Use transaction to ensure atomicity
  const result2 = await prisma.$transaction(async (tx) => {
    // Create contribution
    const contribucion = await tx.contribucion.create({
      data: {
        ...contribucionData,
        fecha: fecha || new Date(),
        metaId,
      },
    })

    // Update meta
    const newMontoActual = Number(meta.montoActual) + contribucionData.monto
    const montoObjetivo = Number(meta.montoObjetivo)
    const porcentajeProgreso = montoObjetivo > 0
      ? Number(((newMontoActual / montoObjetivo) * 100).toFixed(2))
      : 0

    // Check if goal is completed
    const isCompleted = newMontoActual >= montoObjetivo && meta.estado !== 'COMPLETADA'

    const updatedMeta = await tx.meta.update({
      where: { id: metaId },
      data: {
        montoActual: newMontoActual,
        porcentajeProgreso,
        ...(isCompleted && {
          estado: 'COMPLETADA',
          fechaCompletada: new Date(),
        }),
      },
    })

    return { contribucion, meta: updatedMeta }
  })

  return result2
})
