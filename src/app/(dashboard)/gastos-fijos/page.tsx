'use client'
import { useEffect, useState } from 'react'
import GastoFijoForm from '@/components/gastos-fijos/GastoFijoForm'

interface GastoFijo {
  id: string
  nombre: string
  monto: string | number
  categoria: string
  frecuencia: string
  diaSemana?: number | null
  diaMes?: number | null
  fechaBase: string
  activo: boolean
  lastApplied?: string | null
}

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const FREC_LABEL: Record<string, string> = {
  MENSUAL: 'Mensual', QUINCENAL: 'Quincenal', SEMANAL: 'Semanal',
}
const CAT_EMOJI: Record<string, string> = {
  ALIMENTACION: '🍽️', TRANSPORTE: '🚗', ENTRETENIMIENTO: '🎬',
  SALUD: '💊', SERVICIOS: '🏠', OTROS: '📦',
}

export default function GastosFijosPage() {
  const [gastosFijos, setGastosFijos] = useState<GastoFijo[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<GastoFijo | null>(null)
  const [loading, setLoading] = useState(true)

  const cargar = async () => {
    setLoading(true)
    const data = await fetch('/api/gastos-fijos').then(r => r.json())
    setGastosFijos(data)
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  const guardar = async (data: any) => {
    const res = editando
      ? await fetch(`/api/gastos-fijos/${editando.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
      : await fetch('/api/gastos-fijos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
    if (!res.ok) { alert('Error al guardar'); return }
    setShowForm(false)
    setEditando(null)
    cargar()
  }

  const desactivar = async (id: string) => {
    if (!confirm('¿Desactivar este gasto fijo?')) return
    const res = await fetch(`/api/gastos-fijos/${id}`, { method: 'DELETE' })
    if (!res.ok) { alert('Error al desactivar'); return }
    cargar()
  }

  const totalMensual = gastosFijos
    .filter(g => g.activo)
    .reduce((s, g) => s + Number(g.monto), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">🔒 Gastos Fijos</h1>
          <p className="text-slate-400 text-sm">
            Total recurrente: <span className="text-orange-400 font-semibold">${totalMensual.toLocaleString('es-MX')} MXN</span>
          </p>
        </div>
        <button onClick={() => { setShowForm(true); setEditando(null) }} className="btn-primary">
          + Nuevo gasto fijo
        </button>
      </div>

      {showForm && (
        <GastoFijoForm onSave={guardar} onCancel={() => setShowForm(false)} />
      )}
      {editando && (
        <GastoFijoForm
          initial={{
            ...editando,
            frecuencia: editando.frecuencia as 'MENSUAL' | 'QUINCENAL' | 'SEMANAL',
            monto: String(editando.monto),
            diaSemana: editando.diaSemana != null ? String(editando.diaSemana) : '',
            diaMes: editando.diaMes != null ? String(editando.diaMes) : '',
            fechaBase: editando.fechaBase?.split('T')[0] ?? '',
          }}
          onSave={guardar}
          onCancel={() => setEditando(null)}
        />
      )}

      {loading ? (
        <p className="text-slate-500">Cargando...</p>
      ) : gastosFijos.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-slate-400">Sin gastos fijos registrados.</p>
          <p className="text-slate-500 text-sm mt-1">Agrega renta, suscripciones, servicios, etc.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {gastosFijos.map(g => (
            <div key={g.id} className="card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl shrink-0">{CAT_EMOJI[g.categoria] ?? '📦'}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-100">{g.nombre}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400">
                      {FREC_LABEL[g.frecuencia]}
                    </span>
                    {!g.activo && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-600 text-slate-400">Inactivo</span>}
                  </div>
                  <p className="text-slate-400 text-sm mt-0.5">
                    ${Number(g.monto).toLocaleString('es-MX')} MXN
                    {g.frecuencia !== 'MENSUAL' && g.diaSemana != null && ` · ${DIAS_SEMANA[g.diaSemana]}`}
                    {g.frecuencia === 'MENSUAL' && g.diaMes && ` · día ${g.diaMes} de cada mes`}
                    {g.lastApplied && ` · aplicado ${new Date(g.lastApplied).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setEditando(g); setShowForm(false) }} className="text-xs text-blue-400 hover:text-blue-300">Editar</button>
                {g.activo && (
                  <button onClick={() => desactivar(g.id)} className="text-xs text-slate-500 hover:text-red-400">Desactivar</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
