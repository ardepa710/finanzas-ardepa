'use client'
import { useState } from 'react'
import { usePresupuestoStatus } from '@/features/presupuestos/hooks/usePresupuestos'
import PresupuestoForm from '@/components/presupuestos/PresupuestoForm'
import PresupuestoCard from '@/components/presupuestos/PresupuestoCard'

const PERIODOS = ['SEMANAL', 'QUINCENAL', 'MENSUAL'] as const
type Periodo = typeof PERIODOS[number]

const PERIODO_LABEL: Record<Periodo, string> = {
  SEMANAL: 'Semanal',
  QUINCENAL: 'Quincenal',
  MENSUAL: 'Mensual',
}

export default function PresupuestosPage() {
  const [showForm, setShowForm] = useState(false)
  const [periodo, setPeriodo] = useState<Periodo>('MENSUAL')

  const { data: statuses, isLoading } = usePresupuestoStatus(periodo)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">💰 Presupuestos</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          + Nuevo presupuesto
        </button>
      </div>

      {showForm && (
        <PresupuestoForm onClose={() => setShowForm(false)} />
      )}

      {/* Period selector */}
      <div className="flex gap-2">
        {PERIODOS.map((p) => (
          <button
            key={p}
            onClick={() => setPeriodo(p)}
            className={`text-sm px-4 py-2 rounded-lg font-medium transition-colors ${
              periodo === p
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            }`}
          >
            {PERIODO_LABEL[p]}
          </button>
        ))}
      </div>

      {/* Budget cards */}
      {isLoading ? (
        <p className="text-slate-500">Cargando presupuestos...</p>
      ) : !statuses || statuses.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-slate-400">
            No hay presupuestos registrados para el periodo {PERIODO_LABEL[periodo].toLowerCase()}.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary mt-4"
          >
            Crear primer presupuesto
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {statuses.map((status: any) => (
            <PresupuestoCard key={status.presupuesto.id} status={status} />
          ))}
        </div>
      )}
    </div>
  )
}
