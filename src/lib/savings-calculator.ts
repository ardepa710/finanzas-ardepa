export type FrecuenciaPago = 'SEMANAL' | 'QUINCENAL' | 'MENSUAL'

export interface FuenteIngresoInput {
  nombre?: string
  monto?: number
  frecuencia: FrecuenciaPago
  diaMes?: number        // only MENSUAL
  /** Almacenado para display en UI. Los cálculos usan únicamente fechaBase + intervalo. */
  diaSemana?: number     // 0=Sun..6=Sat, only SEMANAL/QUINCENAL
  fechaBase?: Date       // required for SEMANAL/QUINCENAL
}

export interface CreditoInput {
  nombre: string
  pagoMensual: number
  frecuencia: FrecuenciaPago
  diaPago?: number       // only MENSUAL
  /** Almacenado para display en UI. Los cálculos usan únicamente fechaBase + intervalo. */
  diaSemana?: number     // only SEMANAL/QUINCENAL
  fechaBase?: Date       // only SEMANAL/QUINCENAL
}

export interface GastoFijoInput {
  nombre: string
  monto: number
  categoria: string
  frecuencia: FrecuenciaPago
  diaMes?: number
  diaSemana?: number
  fechaBase?: Date
}

export interface DesgloseCobro {
  creditoNombre: string
  monto: number
}

export interface ProyeccionCobro {
  fecha: Date
  fuenteNombre: string
  montoIngreso: number
  desglose: DesgloseCobro[]
  desgloseGastosFijos: DesgloseCobro[]
  totalApartar: number
  disponible: number
}

export interface ResumenAhorro {
  cobros: ProyeccionCobro[]
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function getNextByInterval(fechaBase: Date, hoy: Date, step: number, n: number): Date[] {
  let cursor = startOfDay(fechaBase)
  const today = startOfDay(hoy)
  while (cursor <= today) {
    cursor = addDays(cursor, step)
  }
  const result: Date[] = []
  for (let i = 0; i < n; i++) {
    result.push(new Date(cursor))
    cursor = addDays(cursor, step)
  }
  return result
}

/**
 * Devuelve la ocurrencia más reciente del gasto fijo que ya ocurrió (≤ hoy).
 * Returns null si fechaBase está en el futuro.
 */
export function getLastOccurrence(gasto: GastoFijoInput, hoy: Date): Date | null {
  const today = startOfDay(hoy)

  if (gasto.frecuencia === 'MENSUAL') {
    if (gasto.diaMes == null) throw new Error('GastoFijo MENSUAL requiere diaMes')
    const dia = gasto.diaMes
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), dia)
    if (thisMonth <= today) return thisMonth
    return new Date(today.getFullYear(), today.getMonth() - 1, dia)
  }

  const step = gasto.frecuencia === 'SEMANAL' ? 7 : 14
  if (!gasto.fechaBase) throw new Error(`GastoFijo ${gasto.frecuencia} requiere fechaBase`)

  let cursor = startOfDay(gasto.fechaBase)
  if (cursor > today) return null

  let last: Date = new Date(cursor)
  while (true) {
    const next = addDays(cursor, step)
    if (next > today) break
    last = new Date(next)
    cursor = next
  }
  return last
}

export function getNextOccurrences(
  fuente: FuenteIngresoInput,
  hoy: Date,
  n: number
): Date[] {
  if (fuente.frecuencia === 'MENSUAL') {
    if (fuente.diaMes == null) throw new Error('FuenteIngreso MENSUAL requiere diaMes')
    const dia = fuente.diaMes
    const result: Date[] = []
    const today = startOfDay(hoy)
    let year = today.getFullYear()
    let month = today.getMonth()
    while (result.length < n) {
      const candidate = new Date(year, month, dia)
      if (candidate > today) result.push(candidate)
      month++
      if (month > 11) { month = 0; year++ }
    }
    return result
  }
  const step = fuente.frecuencia === 'SEMANAL' ? 7 : 14
  if (!fuente.fechaBase) throw new Error(`FuenteIngreso ${fuente.frecuencia} requiere fechaBase`)
  return getNextByInterval(fuente.fechaBase, hoy, step, n)
}

export function getNextCreditDueDate(credito: CreditoInput, hoy: Date): Date {
  if (credito.frecuencia === 'MENSUAL') {
    const today = startOfDay(hoy)
    if (credito.diaPago == null) throw new Error('Credito MENSUAL requiere diaPago')
    const dia = credito.diaPago
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), dia, 23, 59, 0)
    if (thisMonth > today) return thisMonth
    return new Date(today.getFullYear(), today.getMonth() + 1, dia, 23, 59, 0)
  }
  const step = credito.frecuencia === 'SEMANAL' ? 7 : 14
  if (!credito.fechaBase) throw new Error(`Credito ${credito.frecuencia} requiere fechaBase`)
  let cursor = startOfDay(credito.fechaBase)
  const today = startOfDay(hoy)
  while (cursor <= today) {
    cursor = addDays(cursor, step)
  }
  return cursor
}

export function calcularResumenAhorro(
  creditos: CreditoInput[],
  fuentes: FuenteIngresoInput[],
  hoy: Date,
  horizonte = 3,
  gastosFijos: GastoFijoInput[] = []
): ResumenAhorro {
  const todosLosCobros: Array<{ fecha: Date; fuente: FuenteIngresoInput }> = []
  for (const fuente of fuentes) {
    const fechas = getNextOccurrences(fuente, hoy, horizonte)
    fechas.forEach(fecha => todosLosCobros.push({ fecha, fuente }))
  }
  todosLosCobros.sort((a, b) => a.fecha.getTime() - b.fecha.getTime())

  const cobrosFinal = todosLosCobros.slice(0, horizonte)

  const cobros: ProyeccionCobro[] = cobrosFinal.map(({ fecha, fuente }, idx) => {
    const desglose: DesgloseCobro[] = []

    for (const credito of creditos) {
      const vencimiento = getNextCreditDueDate(credito, hoy)
      const allFuente = getNextOccurrences(fuente, hoy, horizonte * 2)
      const cobrosAntesDeVencer = allFuente.filter(f => f < vencimiento)
      const n = cobrosAntesDeVencer.length || 1

      if (fecha < vencimiento || cobrosAntesDeVencer.length === 0) {
        const porCobro = Math.round((credito.pagoMensual / n) * 100) / 100
        desglose.push({ creditoNombre: credito.nombre, monto: porCobro })
      }
    }

    // ── Gastos fijos ──
    // Window: from this cobro date to the next cobro date (or +30 days if last)
    const nextCobroFecha = cobrosFinal[idx + 1]?.fecha ?? addDays(fecha, 30)
    const desgloseGastosFijos: DesgloseCobro[] = []
    for (const gf of gastosFijos) {
      // Next occurrence of this gasto fijo from this cobro's date
      const occurrences = getNextOccurrences(
        {
          nombre: gf.nombre,
          monto: gf.monto,
          frecuencia: gf.frecuencia,
          diaMes: gf.diaMes,
          fechaBase: gf.fechaBase ?? fecha,
          diaSemana: gf.diaSemana,
        },
        fecha,
        1
      )
      const nextOcc = occurrences[0]
      if (nextOcc && nextOcc < nextCobroFecha) {
        desgloseGastosFijos.push({ creditoNombre: gf.nombre, monto: gf.monto })
      }
    }

    const totalApartar = Math.round(
      [...desglose, ...desgloseGastosFijos].reduce((s, d) => s + d.monto, 0) * 100
    ) / 100
    const montoIngreso = fuente.monto ?? 0

    return {
      fecha,
      fuenteNombre: fuente.nombre ?? 'Ingreso',
      montoIngreso,
      desglose,
      desgloseGastosFijos,
      totalApartar,
      disponible: Math.round((montoIngreso - totalApartar) * 100) / 100,
    }
  })

  return { cobros }
}
