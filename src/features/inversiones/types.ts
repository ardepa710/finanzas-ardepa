import { Inversion, TransaccionInversion, Activo, TipoTransaccion } from '@/generated/prisma/client'

export interface InversionInput {
  activoId: string
  montoInvertido: number
  fechaInversion: Date | string
  valorActual: number
  dividendos?: number
  intereses?: number
  descripcion?: string
}

export interface InversionWithTransacciones extends Inversion {
  transacciones: TransaccionInversion[]
  activo: Activo
}

export interface TransaccionInput {
  tipo: TipoTransaccion
  monto: number
  fecha: Date | string
  descripcion?: string
}

export interface TransaccionWithInversion extends TransaccionInversion {
  inversion: Inversion
}

export interface InversionResumen {
  totalInversiones: number
  montoTotalInvertido: number
  valorActualTotal: number
  rendimientoTotal: number
  rendimientoPct: number
  dividendosTotal: number
  interesesTotal: number
  porActivo: {
    activoId: string
    activoNombre: string
    montoInvertido: number
    valorActual: number
    rendimiento: number
    rendimientoPct: number
  }[]
  mejores: {
    activoId: string
    activoNombre: string
    rendimientoPct: number
  }[]
  peores: {
    activoId: string
    activoNombre: string
    rendimientoPct: number
  }[]
}

export interface PortfolioPerformance {
  totalInvertido: number
  valorActual: number
  ganancia: number
  rentabilidad: number
  distribucionPorTipo: {
    tipo: string
    monto: number
    porcentaje: number
  }[]
  evolucionTemporal: {
    fecha: Date
    valorTotal: number
  }[]
}

export interface InversionRanked extends Inversion {
  activo: Activo
  rank: number
}
