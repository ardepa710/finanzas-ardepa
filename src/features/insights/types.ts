export type TipoInsightFrontend = 'ALERTA' | 'OPORTUNIDAD' | 'LOGRO' | 'SUGERENCIA'

export interface InsightGenerado {
  tipo: TipoInsightFrontend
  titulo: string
  descripcion: string
  accion: string
  prioridad: 1 | 2 | 3 | 4 | 5
  datos: Record<string, number | string>
}

export interface ContextoFinanciero {
  ingresoMensual: number
  gastoPromedio90d: number
  deudaTotal: number
  dti: number
  savingsRate: number
  metasActivas: number
  metasProgreso: number
  cashflowProximo: number
}
