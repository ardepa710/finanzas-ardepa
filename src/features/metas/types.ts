import { CategoriaMeta, EstadoMeta, PrioridadMeta } from '@/generated/prisma/client'

export interface MetaInput {
  nombre: string
  descripcion?: string
  categoria: CategoriaMeta
  montoObjetivo: number
  fechaObjetivo?: Date
  prioridad?: PrioridadMeta
}

export interface MetaWithContribuciones {
  id: string
  nombre: string
  descripcion: string | null
  categoria: CategoriaMeta
  montoObjetivo: number
  montoActual: number
  porcentajeProgreso: number
  fechaInicio: Date
  fechaObjetivo: Date | null
  fechaCompletada: Date | null
  estado: EstadoMeta
  prioridad: PrioridadMeta
  activo: boolean
  createdAt: Date
  updatedAt: Date
  contribuciones: Array<{
    id: string
    metaId: string
    monto: number
    fecha: Date
    descripcion: string | null
    createdAt: Date
  }>
}

export interface ContribucionInput {
  monto: number
  fecha?: Date
  descripcion?: string
}

export interface MetaResumen {
  totalMetas: number
  metasActivas: number
  metasCompletadas: number
  montoObjetivoTotal: number
  montoAhorradoTotal: number
  progresoPromedio: number
  porCategoria: Array<{
    categoria: CategoriaMeta
    cantidad: number
    monto: number
  }>
}

export interface MetaProyeccion {
  metaId: string
  nombreMeta: string
  montoFaltante: number
  ahorroMensualRequerido: number
  mesesEstimados: number
  fechaEstimadaComplecion: Date
  esAlcanzable: boolean  // Based on user's average savings capacity
}
