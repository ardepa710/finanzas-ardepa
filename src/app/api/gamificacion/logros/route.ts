import { prisma } from '@/lib/prisma'
import { withErrorHandling } from '@/lib/api-error'

export const GET = withErrorHandling(async () => {
  const logros = await prisma.logro.findMany({
    orderBy: [{ desbloqueado: 'desc' }, { xp: 'desc' }],
  })
  return logros
})
