import { prisma } from '@/lib/prisma'
import { withErrorHandling, APIError, ErrorCodes } from '@/lib/api-error'
import { activoSchema } from '@/shared/validations/schemas'

export const GET = withErrorHandling(async (req: Request) => {
  const url = new URL(req.url)
  const activoParam = url.searchParams.get('activo')

  const where: any = {}

  if (activoParam === 'true') {
    where.activo = true
  }

  const activos = await prisma.activo.findMany({
    where,
    include: {
      historico: {
        orderBy: { fecha: 'desc' },
        take: 5, // Last 5 valuations
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return activos
})

export const POST = withErrorHandling(async (req: Request) => {
  const body = await req.json()
  const result = activoSchema.safeParse(body)

  if (!result.success) {
    throw new APIError(ErrorCodes.VALIDATION_ERROR, result.error.issues[0].message)
  }

  const { fechaAdquisicion, ...data } = result.data

  // Create activo with initial valoración
  const activo = await prisma.activo.create({
    data: {
      ...data,
      fechaAdquisicion: fechaAdquisicion || null,
      historico: {
        create: {
          valor: data.valorActual,
          fecha: fechaAdquisicion || new Date(),
          notas: 'Valoración inicial',
        },
      },
    },
    include: {
      historico: {
        orderBy: { fecha: 'desc' },
      },
    },
  })

  return activo
})
