export interface CreditoInput {
  nombre: string
  pagoMensual: number
  diaPago: number // day of month 1-31
}

export interface AhorroPorCredito {
  nombre: string
  montoTotal: number
  porPago: number[]
}

export interface ResumenAhorro {
  totalProximoPago: number
  desglose: AhorroPorCredito[]
  proximaFechaPago: Date
  diasParaProximoPago: number
  salarioDisponible: number
}

/**
 * Returns the next N salary paydays.
 * Salary is paid every 14 days (alternating Mondays) starting from a known base date.
 */
export function getNextPaydays(
  fechaBase: Date,
  hoy: Date,
  cantidad: number
): Date[] {
  const pagos: Date[] = []
  let cursor = new Date(fechaBase)

  // Advance until we find a future payday
  while (cursor <= hoy) {
    cursor = new Date(cursor.getTime() + 14 * 24 * 60 * 60 * 1000)
  }

  for (let i = 0; i < cantidad; i++) {
    pagos.push(new Date(cursor))
    cursor = new Date(cursor.getTime() + 14 * 24 * 60 * 60 * 1000)
  }

  return pagos
}

/**
 * Returns the next due date for a credit given its day of month.
 */
function getProximaFechaVencimiento(diaPago: number, hoy: Date): Date {
  const year = hoy.getFullYear()
  const month = hoy.getMonth()
  const dayToday = hoy.getDate()

  if (diaPago > dayToday) {
    return new Date(year, month, diaPago, 23, 59, 0)
  } else {
    return new Date(year, month + 1, diaPago, 23, 59, 0)
  }
}

/**
 * Calculates how much to set aside from each payday to cover a credit payment.
 * Distributes the payment evenly across paydays that fall before the due date.
 */
export function calcularAhorroPorCredito(
  credito: CreditoInput,
  proximosPagos: Date[],
  fechaVencimiento: Date
): AhorroPorCredito {
  const pagosAntesDeVencer = proximosPagos.filter(p => p < fechaVencimiento)
  const n = pagosAntesDeVencer.length || 1
  const porPago = Array(proximosPagos.length).fill(0)

  for (let i = 0; i < n && i < porPago.length; i++) {
    porPago[i] = credito.pagoMensual / n
  }

  return {
    nombre: credito.nombre,
    montoTotal: credito.pagoMensual,
    porPago,
  }
}

/**
 * Calculates the full savings recommendation for all active credits.
 */
export function calcularResumenAhorro(
  creditos: CreditoInput[],
  fechaBase: Date,
  hoy: Date,
  salario: number = 22000
): ResumenAhorro {
  const proximosPagos = getNextPaydays(fechaBase, hoy, 6)
  const proximaFechaPago = proximosPagos[0]

  const diasParaProximoPago = Math.ceil(
    (proximaFechaPago.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
  )

  const desglose = creditos.map(credito => {
    const fechaVencimiento = getProximaFechaVencimiento(credito.diaPago, hoy)
    return calcularAhorroPorCredito(credito, proximosPagos, fechaVencimiento)
  })

  const totalProximoPago = desglose.reduce(
    (sum, c) => sum + (c.porPago[0] || 0),
    0
  )

  const rounded = Math.round(totalProximoPago * 100) / 100

  return {
    totalProximoPago: rounded,
    desglose,
    proximaFechaPago,
    diasParaProximoPago,
    salarioDisponible: Math.round((salario - rounded) * 100) / 100,
  }
}
