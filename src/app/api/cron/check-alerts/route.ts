/**
 * Cron job endpoint for checking alert rules
 * POST /api/cron/check-alerts
 *
 * This endpoint should be called daily (e.g., via Vercel Cron or external scheduler)
 * to automatically check all business rules and generate notifications
 */

import { runAllAlertRules } from '@/features/alertas/engine/alert-rules'
import { withErrorHandling } from '@/lib/api-error'

export const POST = withErrorHandling(async () => {
  const result = await runAllAlertRules()
  return result
})
