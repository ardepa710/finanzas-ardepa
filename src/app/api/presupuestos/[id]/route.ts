import { prisma } from '@/lib/prisma'
import { withErrorHandling, APIError, ErrorCodes } from '@/lib/api-error'
import { presupuestoSchema } from '@/shared/validations/schemas'

export const GET = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  const presupuesto = await prisma.presupuesto.findUnique({
    where: { id: params.id },
    include: { categoria: true },
  })

  if (!presupuesto) {
    throw new APIError(ErrorCodes.NOT_FOUND, 'Presupuesto no encontrado', 404)
  }

  return presupuesto
})

export const PATCH = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  const body = await req.json()
  const result = presupuestoSchema.partial().safeParse(body)

  if (!result.success) {
    throw new APIError(ErrorCodes.VALIDATION_ERROR, result.error.issues[0].message)
  }

  const presupuesto = await prisma.presupuesto.update({
    where: { id: params.id },
    data: result.data,
    include: { categoria: true },
  })

  return presupuesto
})

export const DELETE = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  const presupuesto = await prisma.presupuesto.update({
    where: { id: params.id },
    data: { activo: false },
    include: { categoria: true },
  })

  return presupuesto
})
