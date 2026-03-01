import { withErrorHandling } from '@/lib/api-error'
import { generarInsights } from '@/features/insights/services/insight-generator'

export const GET = withErrorHandling(async () => {
  const insights = await generarInsights()
  return insights
})
