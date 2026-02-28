import { prisma } from '@/lib/prisma'
import { withErrorHandling, APIError, ErrorCodes } from '@/lib/api-error'
import { valoracionSchema } from '@/shared/validations/schemas'

export const GET = withErrorHandling(
  async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params

    // Verify activo exists
    const activo = await prisma.activo.findUnique({
      where: { id },
    })

    if (!activo) {
      throw new APIError(ErrorCodes.NOT_FOUND, 'Activo no encontrado', 404)
    }

    const valoraciones = await prisma.valoracionActivo.findMany({
      where: { activoId: id },
      orderBy: { fecha: 'desc' },
    })

    return valoraciones
  }
)

export const POST = withErrorHandling(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params
    const body = await req.json()
    const result = valoracionSchema.safeParse(body)

    if (!result.success) {
      throw new APIError(ErrorCodes.VALIDATION_ERROR, result.error.issues[0].message)
    }

    // Verify activo exists
    const activo = await prisma.activo.findUnique({
      where: { id },
    })

    if (!activo) {
      throw new APIError(ErrorCodes.NOT_FOUND, 'Activo no encontrado', 404)
    }

    // Create valoración and update valorActual in a transaction
    const [valoracion] = await prisma.$transaction([
      prisma.valoracionActivo.create({
        data: {
          activoId: id,
          valor: result.data.valor,
          fecha: result.data.fecha,
          notas: result.data.notas || null,
        },
      }),
      prisma.activo.update({
        where: { id },
        data: { valorActual: result.data.valor },
      }),
    ])

    return valoracion
  }
)
