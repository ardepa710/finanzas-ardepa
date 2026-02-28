import { prisma } from '@/lib/prisma'
import { withErrorHandling, APIError, ErrorCodes } from '@/lib/api-error'
import { updateMetaSchema } from '@/shared/validations/schemas'

export const GET = withErrorHandling(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params

  const meta = await prisma.meta.findUnique({
    where: { id },
    include: {
      contribuciones: {
        orderBy: { fecha: 'desc' },
      },
    },
  })

  if (!meta) {
    throw new APIError(ErrorCodes.NOT_FOUND, 'Meta no encontrada', 404)
  }

  return meta
})

export const PUT = withErrorHandling(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const body = await req.json()
  const result = updateMetaSchema.safeParse(body)

  if (!result.success) {
    throw new APIError(ErrorCodes.VALIDATION_ERROR, result.error.issues[0].message)
  }

  const meta = await prisma.meta.findUnique({
    where: { id },
  })

  if (!meta) {
    throw new APIError(ErrorCodes.NOT_FOUND, 'Meta no encontrada', 404)
  }

  const { montoActual, montoObjetivo, ...otherData } = result.data

  // Calculate new porcentajeProgreso if either amount changes
  let porcentajeProgreso: number | undefined
  const newMontoActual = montoActual !== undefined ? montoActual : Number(meta.montoActual)
  const newMontoObjetivo = montoObjetivo !== undefined ? montoObjetivo : Number(meta.montoObjetivo)

  if (montoActual !== undefined || montoObjetivo !== undefined) {
    porcentajeProgreso = newMontoObjetivo > 0
      ? Number(((newMontoActual / newMontoObjetivo) * 100).toFixed(2))
      : 0
  }

  const updatedMeta = await prisma.meta.update({
    where: { id },
    data: {
      ...otherData,
      ...(montoActual !== undefined && { montoActual }),
      ...(montoObjetivo !== undefined && { montoObjetivo }),
      ...(porcentajeProgreso !== undefined && { porcentajeProgreso }),
    },
  })

  return updatedMeta
})

export const DELETE = withErrorHandling(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params

  const meta = await prisma.meta.findUnique({
    where: { id },
  })

  if (!meta) {
    throw new APIError(ErrorCodes.NOT_FOUND, 'Meta no encontrada', 404)
  }

  // Soft delete
  await prisma.meta.update({
    where: { id },
    data: { activo: false },
  })

  return { success: true }
})
