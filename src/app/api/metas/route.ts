import { prisma } from '@/lib/prisma'
import { withErrorHandling, APIError, ErrorCodes } from '@/lib/api-error'
import { metaSchema } from '@/shared/validations/schemas'
import { EstadoMeta, CategoriaMeta } from '@/generated/prisma/client'

export const GET = withErrorHandling(async (req: Request) => {
  const url = new URL(req.url)
  const estadoParam = url.searchParams.get('estado')
  const categoriaParam = url.searchParams.get('categoria')

  const where: any = { activo: true }

  if (estadoParam) {
    where.estado = estadoParam as EstadoMeta
  }

  if (categoriaParam) {
    where.categoria = categoriaParam as CategoriaMeta
  }

  const metas = await prisma.meta.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  return metas
})

export const POST = withErrorHandling(async (req: Request) => {
  const body = await req.json()
  const result = metaSchema.safeParse(body)

  if (!result.success) {
    throw new APIError(ErrorCodes.VALIDATION_ERROR, result.error.issues[0].message)
  }

  const { fechaObjetivo, ...data } = result.data

  // Create meta with explicit decimal values to ensure proper formatting
  const meta = await prisma.meta.create({
    data: {
      ...data,
      fechaObjetivo: fechaObjetivo || null,
      montoActual: 0.00,
      porcentajeProgreso: 0.00,
      // estado defaults to EN_PROGRESO
      // activo defaults to true
    },
  })

  return meta
})
