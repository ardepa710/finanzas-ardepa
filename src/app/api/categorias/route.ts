import { prisma } from '@/lib/prisma'
import { withErrorHandling } from '@/lib/api-error'

export const GET = withErrorHandling(async () => {
  const categorias = await prisma.categoria.findMany({
    where: { activa: true, tipo: 'GASTO' },
    orderBy: { orden: 'asc' },
  })
  return categorias
})
