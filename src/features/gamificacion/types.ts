export interface LogroConEstado {
  id: string
  codigo: string
  nombre: string
  descripcion: string
  icono: string
  categoria: string
  xp: number
  desbloqueado: boolean
  fechaLogro: Date | null
}

export interface CheckLogrosResult {
  nuevos: LogroConEstado[]
  xpGanado: number
}
