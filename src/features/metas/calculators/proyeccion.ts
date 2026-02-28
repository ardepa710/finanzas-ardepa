/**
 * Calculate months needed to reach goal
 */
export function calculateMesesParaMeta(
  montoObjetivo: number,
  montoActual: number,
  ahorroMensual: number
): number {
  const montoFaltante = montoObjetivo - montoActual

  // Already completed
  if (montoFaltante <= 0) {
    return 0
  }

  // No savings capacity
  if (ahorroMensual <= 0) {
    return Infinity
  }

  // Calculate months and round up
  return Math.ceil(montoFaltante / ahorroMensual)
}

/**
 * Project completion date
 */
export function projectFechaComplecion(mesesRestantes: number): Date {
  const fecha = new Date()
  fecha.setMonth(fecha.getMonth() + mesesRestantes)
  return fecha
}

/**
 * Check if goal is achievable by target date
 */
export function esMetaAlcanzable(
  montoFaltante: number,
  ahorroMensual: number,
  fechaObjetivo: Date | null
): boolean {
  // No deadline = always achievable
  if (!fechaObjetivo) {
    return true
  }

  // Already completed
  if (montoFaltante <= 0) {
    return true
  }

  // No savings capacity
  if (ahorroMensual <= 0) {
    return false
  }

  // Calculate months available
  const today = new Date()
  const mesesDisponibles = Math.max(
    0,
    Math.floor(
      (fechaObjetivo.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
    )
  )

  // Calculate months needed
  const mesesNecesarios = Math.ceil(montoFaltante / ahorroMensual)

  return mesesDisponibles >= mesesNecesarios
}

/**
 * Calculate monthly savings needed to reach goal by target date
 */
export function calcularAhorroMensualRequerido(
  montoFaltante: number,
  fechaObjetivo: Date
): number {
  // Already completed
  if (montoFaltante <= 0) {
    return 0
  }

  // Calculate months available
  const today = new Date()
  const mesesDisponibles = Math.max(
    0,
    (fechaObjetivo.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
  )

  // Past date or no time
  if (mesesDisponibles <= 0) {
    return Infinity
  }

  return montoFaltante / mesesDisponibles
}
