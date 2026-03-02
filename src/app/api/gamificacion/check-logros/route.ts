import { withErrorHandling } from '@/lib/api-error'
import { checkLogros } from '@/features/gamificacion/services/logros-checker'

export const POST = withErrorHandling(async () => {
  const result = await checkLogros()
  return result
})
