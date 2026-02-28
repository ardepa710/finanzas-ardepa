/**
 * GastosReport - Expense report with category breakdown
 */

import React from 'react'
import TrendBadge from './TrendBadge'

interface CategoriaData {
  categoria: string
  monto: number
  porcentaje: number
  tendencia: 'subida' | 'bajada' | 'estable'
}

interface GastosReportData {
  periodo: { inicio: string; fin: string }
  total: number
  promedio: number
  porCategoria: CategoriaData[]
  tendenciaGeneral: 'subida' | 'bajada' | 'estable'
}

interface GastosReportProps {
  data: GastosReportData
}

export default function GastosReport({ data }: GastosReportProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(amount)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-slate-400 text-sm mb-1">Total Gastos</p>
          <p className="text-2xl font-bold text-slate-100">{formatCurrency(data.total)}</p>
        </div>
        <div className="card">
          <p className="text-slate-400 text-sm mb-1">Promedio Diario</p>
          <p className="text-2xl font-bold text-slate-100">{formatCurrency(data.promedio)}</p>
        </div>
        <div className="card">
          <p className="text-slate-400 text-sm mb-1">Tendencia General</p>
          <div className="mt-2">
            <TrendBadge tendencia={data.tendenciaGeneral} />
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="card">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">Por Categoría</h3>
        <div className="space-y-4">
          {data.porCategoria.map((cat) => (
            <div key={cat.categoria} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-slate-200 font-medium">{cat.categoria}</span>
                  <TrendBadge tendencia={cat.tendencia} />
                </div>
                <span className="text-slate-100 font-bold">{formatCurrency(cat.monto)}</span>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${cat.porcentaje}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>{cat.porcentaje.toFixed(1)}% del total</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
