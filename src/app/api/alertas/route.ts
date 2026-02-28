import { prisma } from '@/lib/prisma'
import { withErrorHandling, APIError, ErrorCodes } from '@/lib/api-error'
import { notificacionSchema } from '@/shared/validations/schemas'

export const GET = withErrorHandling(async (req: Request) => {
  const { searchParams } = new URL(req.url)
  const todas = searchParams.get('todas') === 'true'

  const notificaciones = await prisma.notificacion.findMany({
    where: todas ? {} : { leida: false },
    orderBy: { createdAt: 'desc' },
  })

  return notificaciones
})

export const POST = withErrorHandling(async (req: Request) => {
  const body = await req.json()
  const result = notificacionSchema.safeParse(body)

  if (!result.success) {
    throw new APIError(ErrorCodes.VALIDATION_ERROR, result.error.issues[0].message)
  }

  const notificacion = await prisma.notificacion.create({
    data: {
      tipo: result.data.tipo,
      titulo: result.data.titulo,
      mensaje: result.data.mensaje,
      prioridad: result.data.prioridad,
      metadata: result.data.metadata,
    },
  })

  return notificacion
})
