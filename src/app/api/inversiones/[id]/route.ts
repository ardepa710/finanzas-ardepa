import { prisma } from '@/lib/prisma'
import { withErrorHandling, APIError, ErrorCodes } from '@/lib/api-error'
import { updateInversionSchema } from '@/shared/validations/schemas'
import { calculateRendimientoTotal, calculateRendimientoPct } from '@/features/inversiones/calculators/returns'

export const GET = withErrorHandling(
  async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params

    const inversion = await prisma.inversion.findUnique({
      where: { id },
      include: {
        activo: true,
        transacciones: {
          orderBy: { fecha: 'desc' },
        },
      },
    })

    if (!inversion) {
      throw new APIError(ErrorCodes.NOT_FOUND, 'Inversión no encontrada', 404)
    }

    return inversion
  }
)

export const PUT = withErrorHandling(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params
    const body = await req.json()
    const result = updateInversionSchema.safeParse(body)

    if (!result.success) {
      throw new APIError(ErrorCodes.VALIDATION_ERROR, result.error.issues[0].message)
    }

    // Get existing investment to calculate returns
    const existing = await prisma.inversion.findUnique({
      where: { id },
    })

    if (!existing) {
      throw new APIError(ErrorCodes.NOT_FOUND, 'Inversión no encontrada', 404)
    }

    // If valorActual is updated, recalculate returns
    let updateData: any = {}

    // Copy non-undefined fields
    if (result.data.valorActual !== undefined) {
      const montoInvertido = Number(existing.montoInvertido)
      const valorActual = result.data.valorActual

      updateData.valorActual = valorActual
      updateData.rendimientoTotal = calculateRendimientoTotal(valorActual, montoInvertido)
      updateData.rendimientoPct = calculateRendimientoPct(valorActual, montoInvertido)
    }

    if (result.data.dividendos !== undefined) {
      updateData.dividendos = result.data.dividendos
    }

    if (result.data.intereses !== undefined) {
      updateData.intereses = result.data.intereses
    }

    if (result.data.descripcion !== undefined) {
      updateData.descripcion = result.data.descripcion
    }

    if (result.data.activa !== undefined) {
      updateData.activa = result.data.activa
    }

    const inversion = await prisma.inversion.update({
      where: { id },
      data: updateData,
      include: {
        activo: true,
        transacciones: {
          orderBy: { fecha: 'desc' },
        },
      },
    })

    return inversion
  }
)

export const DELETE = withErrorHandling(
  async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params

    // Soft delete
    const inversion = await prisma.inversion.update({
      where: { id },
      data: { activa: false },
    })

    return inversion
  }
)
