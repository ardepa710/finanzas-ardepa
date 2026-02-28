/**
 * Active Debts Summary Component
 * Displays current active debts overview
 */

import Link from 'next/link'

interface Credito {
  id: string
  nombre: string
  saldoActual: number | string
  pagoMensual: number | string
  tasaInteres: number | string | null
  activo: boolean
}

interface Props {
  creditos: Credito[]
}

export default function ActiveDebtsSummary({ creditos }: Props) {
  const totalBalance = creditos.reduce(
    (sum, c) => sum + Number(c.saldoActual),
    0
  )

  const totalMinimum = creditos.reduce(
    (sum, c) => sum + Number(c.pagoMensual),
    0
  )

  if (creditos.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-12 shadow-lg text-center">
        <p className="text-slate-400 mb-4 text-lg">
          No tienes deudas activas registradas
        </p>
        <Link
          href="/creditos"
          className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Agregar Crédito
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6 shadow-lg">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-100 mb-1">
            Deudas Activas
          </h2>
          <p className="text-sm text-slate-400">
            {creditos.length} {creditos.length === 1 ? 'crédito' : 'créditos'} activos
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-400">Balance Total</p>
          <p className="text-2xl font-bold text-red-400">
            ${totalBalance.toLocaleString('es-MX')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-700/50 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1">Pago Mínimo Mensual</p>
          <p className="text-xl font-semibold text-slate-100">
            ${totalMinimum.toLocaleString('es-MX')}
          </p>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1">Total Créditos</p>
          <p className="text-xl font-semibold text-slate-100">
            {creditos.length}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {creditos.map((c) => (
          <div
            key={c.id}
            className="flex justify-between items-center bg-slate-700/30 rounded-lg p-3"
          >
            <div>
              <p className="font-medium text-slate-100">{c.nombre}</p>
              <p className="text-xs text-slate-400">
                Pago mensual: ${Number(c.pagoMensual).toLocaleString('es-MX')}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-red-400">
                ${Number(c.saldoActual).toLocaleString('es-MX')}
              </p>
              {c.tasaInteres && (
                <p className="text-xs text-slate-500">
                  {Number(c.tasaInteres)}% anual
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
