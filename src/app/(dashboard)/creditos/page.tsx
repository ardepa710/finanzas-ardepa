'use client'
import { useEffect, useState } from 'react'
import CreditoForm from '@/components/creditos/CreditoForm'

interface Credito {
  id: string
  nombre: string
  tipo: string
  montoTotal: string | number
  saldoActual: string | number
  pagoMensual: string | number
  pagoMinimo?: string | number | null
  fechaCorte?: number | null
  diaPago: number
  tasaInteres?: string | number | null
  activo: boolean
}

export default function CreditosPage() {
  const [creditos, setCreditos] = useState<Credito[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<Credito | null>(null)
  const [loading, setLoading] = useState(true)

  const cargar = async () => {
    setLoading(true)
    const res = await fetch('/api/creditos')
    const data = await res.json()
    setCreditos(data)
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  const guardar = async (data: any) => {
    const res = editando
      ? await fetch(`/api/creditos/${editando.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
      : await fetch('/api/creditos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })

    if (!res.ok) {
      alert('Error al guardar el crédito. Intenta de nuevo.')
      return
    }
    setShowForm(false)
    setEditando(null)
    cargar()
  }

  const desactivar = async (id: string) => {
    if (!confirm('¿Marcar este crédito como pagado/inactivo?')) return
    await fetch(`/api/creditos/${id}`, { method: 'DELETE' })
    cargar()
  }

  const iniciarEdicion = (c: Credito) => {
    setEditando(c)
    setShowForm(false)
  }

  const totalDeuda = creditos
    .filter(c => c.activo)
    .reduce((s, c) => s + Number(c.saldoActual), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">💳 Créditos</h1>
          <p className="text-slate-400 text-sm">Deuda total: <span className="text-red-400 font-semibold">${totalDeuda.toLocaleString('es-MX')} MXN</span></p>
        </div>
        <button onClick={() => { setShowForm(true); setEditando(null) }} className="btn-primary">
          + Nuevo crédito
        </button>
      </div>

      {showForm && (
        <CreditoForm
          onSave={guardar}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editando && (
        <CreditoForm
          initial={{
            ...editando,
            tipo: editando.tipo as 'PRESTAMO' | 'TARJETA',
            montoTotal: String(editando.montoTotal),
            saldoActual: String(editando.saldoActual),
            pagoMensual: String(editando.pagoMensual),
            pagoMinimo: editando.pagoMinimo ? String(editando.pagoMinimo) : '',
            fechaCorte: editando.fechaCorte ? String(editando.fechaCorte) : '',
            diaPago: String(editando.diaPago),
            tasaInteres: editando.tasaInteres ? String(editando.tasaInteres) : '',
          }}
          onSave={guardar}
          onCancel={() => setEditando(null)}
        />
      )}

      {loading ? (
        <p className="text-slate-500">Cargando...</p>
      ) : creditos.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-slate-400">Sin créditos registrados.</p>
          <p className="text-slate-500 text-sm mt-1">Haz clic en "Nuevo crédito" para agregar uno.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {creditos.map(c => {
            const progreso = Math.max(0, Math.min(100, 100 - (Number(c.saldoActual) / Number(c.montoTotal)) * 100))
            return (
              <div key={c.id} className="card">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-100">{c.nombre}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${c.tipo === 'TARJETA' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                        {c.tipo === 'TARJETA' ? 'Tarjeta' : 'Préstamo'}
                      </span>
                      {!c.activo && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-600 text-slate-400">Inactivo</span>}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">Pago el día {c.diaPago} de cada mes{c.fechaCorte ? ` · Corte día ${c.fechaCorte}` : ''}</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => iniciarEdicion(c)} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Editar</button>
                    {c.activo && (
                      <button onClick={() => desactivar(c.id)} className="text-xs text-slate-500 hover:text-red-400 transition-colors">Marcar pagado</button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-slate-500">Saldo pendiente</p>
                    <p className="font-semibold text-red-400">${Number(c.saldoActual).toLocaleString('es-MX')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Pago mensual</p>
                    <p className="font-semibold text-slate-200">${Number(c.pagoMensual).toLocaleString('es-MX')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Total original</p>
                    <p className="font-semibold text-slate-400">${Number(c.montoTotal).toLocaleString('es-MX')}</p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Progreso de pago</span>
                    <span>{progreso.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full">
                    <div
                      className="h-2 bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${progreso}%` }}
                    />
                  </div>
                </div>

                {c.tasaInteres && (
                  <p className="text-xs text-slate-500 mt-2">Tasa: {Number(c.tasaInteres)}% anual</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
