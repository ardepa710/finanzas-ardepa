import { prisma } from '@/lib/prisma'
import { withErrorHandling, APIError, ErrorCodes } from '@/lib/api-error'
import { updateActivoSchema } from '@/shared/validations/schemas'

export const GET = withErrorHandling(
  async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params

    const activo = await prisma.activo.findUnique({
      where: { id },
      include: {
        historico: {
          orderBy: { fecha: 'desc' },
        },
      },
    })

    if (!activo) {
      throw new APIError(ErrorCodes.NOT_FOUND, 'Activo no encontrado', 404)
    }

    return activo
  }
)

export const PUT = withErrorHandling(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params
    const body = await req.json()
    const result = updateActivoSchema.safeParse(body)

    if (!result.success) {
      throw new APIError(ErrorCodes.VALIDATION_ERROR, result.error.issues[0].message)
    }

    const activo = await prisma.activo.update({
      where: { id },
      data: result.data,
      include: {
        historico: {
          orderBy: { fecha: 'desc' },
        },
      },
    })

    return activo
  }
)

export const DELETE = withErrorHandling(
  async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params

    // Soft delete
    const activo = await prisma.activo.update({
      where: { id },
      data: { activo: false },
    })

    return activo
  }
)
