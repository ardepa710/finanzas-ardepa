'use client'
import { formatCurrency, formatPercent } from '@/shared/utils/formatters'

interface PresupuestoCardProps {
  status: {
    presupuesto: {
      id: string
      monto: number
      periodo: string
      categoria: {
        id: string
        nombre: string
        icono: string
      }
    }
    gastado: number
    restante: number
    porcentaje: number
    estado: 'OK' | 'ALERTA' | 'EXCEDIDO'
  }
}

export default function PresupuestoCard({ status }: PresupuestoCardProps) {
  const { presupuesto, gastado, restante, porcentaje, estado } = status

  const getColor = () => {
    if (estado === 'EXCEDIDO') return { bg: 'bg-red-500', text: 'text-red-400' }
    if (estado === 'ALERTA') return { bg: 'bg-yellow-500', text: 'text-yellow-400' }
    return { bg: 'bg-green-500', text: 'text-green-400' }
  }

  const color = getColor()

  return (
    <div className="card">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-slate-100">
            {presupuesto.categoria.icono} {presupuesto.categoria.nombre}
          </h3>
          <p className="text-xs text-slate-500">{presupuesto.periodo}</p>
        </div>
        <span className="text-sm font-semibold text-emerald-400">
          {formatCurrency(presupuesto.monto)}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Gastado: {formatCurrency(gastado)}</span>
          <span className="text-slate-400">Restante: {formatCurrency(restante)}</span>
        </div>

        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${color.bg} transition-all duration-500`}
            style={{ width: `${Math.min(100, porcentaje)}%` }}
          />
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-slate-500">{formatPercent(porcentaje)}</span>
          {estado === 'EXCEDIDO' && (
            <span className="text-red-400 font-semibold">¡Presupuesto excedido!</span>
          )}
          {estado === 'ALERTA' && (
            <span className="text-yellow-400 font-semibold">¡Cerca del límite!</span>
          )}
        </div>
      </div>
    </div>
  )
}
