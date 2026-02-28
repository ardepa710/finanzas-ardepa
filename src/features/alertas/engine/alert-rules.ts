/**
 * Master alert rules registry
 * Runs all alert rule checks and creates notifications in bulk
 */

import { prisma } from '@/lib/prisma'
import { checkPresupuestoAlerts } from './presupuesto-alerts'
import { checkCreditoAlerts } from './credito-alerts'
import { checkAhorroAlerts } from './ahorro-alerts'
import { checkGastoInusualAlerts } from './gasto-alerts'

/**
 * Run all alert rules and create notifications
 */
export async function runAllAlertRules() {
  // Run all alert checks in parallel
  const allAlerts = await Promise.all([
    checkPresupuestoAlerts(),
    checkCreditoAlerts(),
    checkAhorroAlerts(),
    checkGastoInusualAlerts(),
  ])

  // Flatten the results
  const alerts = allAlerts.flat()

  // Create notifications in bulk if any alerts were generated
  if (alerts.length > 0) {
    await prisma.notificacion.createMany({
      data: alerts,
      skipDuplicates: true, // Don't fail if duplicate exists
    })
  }

  return {
    created: alerts.length,
    presupuesto: allAlerts[0].length,
    credito: allAlerts[1].length,
    ahorro: allAlerts[2].length,
    gastoInusual: allAlerts[3].length,
  }
}
