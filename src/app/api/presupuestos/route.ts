import { prisma } from '@/lib/prisma'
import { withErrorHandling, APIError, ErrorCodes } from '@/lib/api-error'
import { presupuestoSchema } from '@/shared/validations/schemas'

export const GET = withErrorHandling(async () => {
  const presupuestos = await prisma.presupuesto.findMany({
    where: { activo: true },
    include: { categoria: true },
    orderBy: { createdAt: 'desc' },
  })

  return presupuestos
})

export const POST = withErrorHandling(async (req: Request) => {
  const body = await req.json()
  const result = presupuestoSchema.safeParse(body)

  if (!result.success) {
    throw new APIError(ErrorCodes.VALIDATION_ERROR, result.error.issues[0].message)
  }

  try {
    const presupuesto = await prisma.presupuesto.create({
      data: result.data,
      include: { categoria: true },
    })

    return presupuesto
  } catch (error: any) {
    // Handle unique constraint violation (P2002)
    if (error.code === 'P2002') {
      throw new APIError(
        ErrorCodes.VALIDATION_ERROR,
        'Ya existe un presupuesto para esta categoría en este periodo'
      )
    }
    throw error
  }
})
