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
