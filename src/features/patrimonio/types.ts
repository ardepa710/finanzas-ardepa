import { TipoActivo, Liquidez } from '@/generated/prisma/client'

export interface CreateActivoInput {
  nombre: string
  tipo: TipoActivo
  valorActual: number
  valorCompra?: number
  fechaAdquisicion?: Date
  descripcion?: string
  liquidez?: Liquidez
}

export interface UpdateActivoInput {
  nombre?: string
  valorActual?: number
  descripcion?: string
  liquidez?: Liquidez
  activo?: boolean
}

export interface ActivoWithHistory {
  id: string
  nombre: string
  tipo: TipoActivo
  valorActual: number
  valorCompra: number | null
  fechaAdquisicion: Date | null
  descripcion: string | null
  liquidez: Liquidez
  activo: boolean
  createdAt: Date
  updatedAt: Date
  historico: Array<{
    id: string
    valor: number
    fecha: Date
    notas: string | null
  }>
}

export interface CreateValoracionInput {
  valor: number
  fecha: Date
  notas?: string
}

// Net Worth Calculation Types
export interface PatrimonioPorTipo {
  tipo: TipoActivo
  valor: number
  porcentaje: number
}

export interface PatrimonioPorLiquidez {
  liquidez: Liquidez
  valor: number
  porcentaje: number
}

export interface TopActivo {
  id: string
  nombre: string
  tipo: TipoActivo
  valorActual: number
  porcentajeDelTotal: number
}

export interface DeudaPorCredito {
  id: string
  nombre: string
  saldoActual: number
  porcentajeDelTotal: number
}

export interface PatrimonioDeudas {
  total: number
  porCredito: DeudaPorCredito[]
}

export interface PatrimonioData {
  totalActivos: number
  totalPasivos: number
  patrimonioNeto: number
  porTipo: PatrimonioPorTipo[]
  porLiquidez: PatrimonioPorLiquidez[]
  topActivos: TopActivo[]
  deudas: PatrimonioDeudas
}

export interface PatrimonioResponse {
  patrimonio: PatrimonioData
}
