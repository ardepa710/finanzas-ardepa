'use client'
import { useEffect, useState } from 'react'
import FuenteIngresoForm from '@/components/ingresos/FuenteIngresoForm'
import IngresoManualForm from '@/components/ingresos/IngresoManualForm'

interface FuenteIngreso {
  id: string
  nombre: string
  monto: string | number
  frecuencia: string
  diaSemana?: number | null
  diaMes?: number | null
  fechaBase: string
  activo: boolean
  ingresos?: IngresoManual[]
}

interface IngresoManual {
  id: string
  monto: string | number
  fecha: string
  descripcion?: string | null
  fuente?: { nombre: string } | null
}

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const FREC_LABEL: Record<string, string> = {
  MENSUAL: 'Mensual', QUINCENAL: 'Quincenal', SEMANAL: 'Semanal',
}

export default function IngresosPage() {
  const [fuentes, setFuentes] = useState<FuenteIngreso[]>([])
  const [ingresos, setIngresos] = useState<IngresoManual[]>([])
  const [showFuenteForm, setShowFuenteForm] = useState(false)
  const [editandoFuente, setEditandoFuente] = useState<FuenteIngreso | null>(null)
  const [showIngresoForm, setShowIngresoForm] = useState(false)
  const [loading, setLoading] = useState(true)

  const cargar = async () => {
    setLoading(true)
    const [fRes, iRes] = await Promise.all([
      fetch('/api/ingresos').then(r => r.json()),
      fetch('/api/ingresos/manuales').then(r => r.json()),
    ])
    setFuentes(fRes)
    setIngresos(iRes)
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  const guardarFuente = async (data: any) => {
    const res = editandoFuente
      ? await fetch(`/api/ingresos/${editandoFuente.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
      : await fetch('/api/ingresos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
    if (!res.ok) { alert('Error al guardar'); return }
    setShowFuenteForm(false)
    setEditandoFuente(null)
    cargar()
  }

  const eliminarFuente = async (id: string) => {
    if (!confirm('¿Desactivar esta fuente de ingreso?')) return
    await fetch(`/api/ingresos/${id}`, { method: 'DELETE' })
    cargar()
  }

  const guardarIngreso = async (data: any) => {
    const res = await fetch('/api/ingresos/manuales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) { alert('Error al registrar'); return }
    setShowIngresoForm(false)
    cargar()
  }

  const eliminarIngreso = async (id: string) => {
    if (!confirm('¿Eliminar este registro?')) return
    await fetch(`/api/ingresos/manuales/${id}`, { method: 'DELETE' })
    cargar()
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">💰 Ingresos</h1>
        <p className="text-slate-400 text-sm">Configura tus fuentes de ingreso y registra cobros recibidos.</p>
      </div>

      {/* Fuentes de ingreso */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Fuentes de ingreso</h2>
          <button onClick={() => { setShowFuenteForm(true); setEditandoFuente(null) }} className="btn-primary text-sm">
            + Nueva fuente
          </button>
        </div>

        {showFuenteForm && (
          <FuenteIngresoForm onSave={guardarFuente} onCancel={() => setShowFuenteForm(false)} />
        )}
        {editandoFuente && (
          <FuenteIngresoForm
            initial={{
              ...editandoFuente,
              monto: String(editandoFuente.monto),
              diaSemana: editandoFuente.diaSemana != null ? String(editandoFuente.diaSemana) : '',
              diaMes: editandoFuente.diaMes != null ? String(editandoFuente.diaMes) : '',
              fechaBase: editandoFuente.fechaBase?.split('T')[0] ?? '',
            }}
            onSave={guardarFuente}
            onCancel={() => setEditandoFuente(null)}
          />
        )}

        {loading ? (
          <p className="text-slate-500">Cargando...</p>
        ) : fuentes.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-slate-400">Sin fuentes de ingreso configuradas.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {fuentes.map(f => (
              <div key={f.id} className="card flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-100">{f.nombre}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                      {FREC_LABEL[f.frecuencia]}
                    </span>
                    {!f.activo && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-600 text-slate-400">Inactiva</span>}
                  </div>
                  <p className="text-slate-400 text-sm mt-0.5">
                    ${Number(f.monto).toLocaleString('es-MX')} MXN
                    {f.frecuencia !== 'MENSUAL' && f.diaSemana != null && ` · ${DIAS_SEMANA[f.diaSemana]}`}
                    {f.frecuencia === 'MENSUAL' && f.diaMes && ` · día ${f.diaMes} de cada mes`}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setEditandoFuente(f); setShowFuenteForm(false) }}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Editar
                  </button>
                  {f.activo && (
                    <button onClick={() => eliminarFuente(f.id)} className="text-xs text-slate-500 hover:text-red-400">
                      Desactivar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Ingresos manuales */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Cobros registrados</h2>
          <button onClick={() => setShowIngresoForm(true)} className="btn-primary text-sm">+ Registrar cobro</button>
        </div>

        {showIngresoForm && (
          <IngresoManualForm
            fuentes={fuentes.filter(f => f.activo)}
            onSave={guardarIngreso}
            onCancel={() => setShowIngresoForm(false)}
          />
        )}

        {ingresos.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-slate-400 text-sm">Sin cobros registrados aún.</p>
          </div>
        ) : (
          <div className="card">
            <div className="space-y-3">
              {ingresos.map(i => (
                <div key={i.id} className="flex items-center gap-3">
                  <span className="text-xl shrink-0">💵</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate">{i.descripcion ?? i.fuente?.nombre ?? 'Ingreso'}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(i.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {i.fuente && ` · ${i.fuente.nombre}`}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-400 shrink-0">
                    +${Number(i.monto).toLocaleString('es-MX')}
                  </span>
                  <button onClick={() => eliminarIngreso(i.id)} className="text-xs text-slate-600 hover:text-red-400">✕</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
