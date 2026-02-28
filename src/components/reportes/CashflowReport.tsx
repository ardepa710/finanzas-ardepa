/**
 * CashflowReport - Period-by-period cashflow table
 */

import React from 'react'

interface PeriodoData {
  periodo: string
  ingresos: number
  gastos: number
  neto: number
  balanceAcumulado: number
}

interface CashflowReportData {
  periodo: string
  periodos: PeriodoData[]
  totales: {
    ingresos: number
    gastos: number
    neto: number
  }
}

interface CashflowReportProps {
  data: CashflowReportData
}

export default function CashflowReport({ data }: CashflowReportProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(amount)

  const getNetoColor = (neto: number) => {
    if (neto > 0) return 'text-green-500'
    if (neto < 0) return 'text-red-500'
    return 'text-slate-400'
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-slate-400 text-sm mb-1">Total Ingresos</p>
          <p className="text-2xl font-bold text-green-500">{formatCurrency(data.totales.ingresos)}</p>
        </div>
        <div className="card">
          <p className="text-slate-400 text-sm mb-1">Total Gastos</p>
          <p className="text-2xl font-bold text-red-500">{formatCurrency(data.totales.gastos)}</p>
        </div>
        <div className="card">
          <p className="text-slate-400 text-sm mb-1">Neto Total</p>
          <p className={`text-2xl font-bold ${getNetoColor(data.totales.neto)}`}>
            {formatCurrency(data.totales.neto)}
          </p>
        </div>
      </div>

      {/* Cashflow Table */}
      <div className="card overflow-x-auto">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">
          Flujo por {data.periodo === 'mensual' ? 'Mes' : data.periodo === 'semanal' ? 'Semana' : 'Quincena'}
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-3 px-2 text-slate-400 font-medium">Periodo</th>
              <th className="text-right py-3 px-2 text-slate-400 font-medium">Ingresos</th>
              <th className="text-right py-3 px-2 text-slate-400 font-medium">Gastos</th>
              <th className="text-right py-3 px-2 text-slate-400 font-medium">Neto</th>
              <th className="text-right py-3 px-2 text-slate-400 font-medium">Balance</th>
            </tr>
          </thead>
          <tbody>
            {data.periodos.map((periodo, idx) => (
              <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                <td className="py-3 px-2 text-slate-200 font-medium">{periodo.periodo}</td>
                <td className="py-3 px-2 text-right text-green-500">
                  {formatCurrency(periodo.ingresos)}
                </td>
                <td className="py-3 px-2 text-right text-red-500">
                  {formatCurrency(periodo.gastos)}
                </td>
                <td className={`py-3 px-2 text-right font-medium ${getNetoColor(periodo.neto)}`}>
                  {formatCurrency(periodo.neto)}
                </td>
                <td className={`py-3 px-2 text-right font-bold ${getNetoColor(periodo.balanceAcumulado)}`}>
                  {formatCurrency(periodo.balanceAcumulado)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
