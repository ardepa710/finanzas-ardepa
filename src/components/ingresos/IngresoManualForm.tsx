'use client'
import { useState } from 'react'

export interface IngresoManualFormData {
  monto: string
  fecha: string
  descripcion: string
  fuenteId: string
}

interface Fuente { id: string; nombre: string }

interface Props {
  fuentes: Fuente[]
  onSave: (data: IngresoManualFormData) => void
  onCancel: () => void
}

export default function IngresoManualForm({ fuentes, onSave, onCancel }: Props) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState<IngresoManualFormData>({
    monto: '',
    fecha: today,
    descripcion: '',
    fuenteId: '',
  })

  const set = (k: keyof IngresoManualFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h3 className="font-semibold text-slate-100">Registrar cobro</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-slate-400 block mb-1">Monto recibido</label>
          <input required type="number" step="0.01" min="0" value={form.monto} onChange={set('monto')} className="input" placeholder="22000" />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Fecha</label>
          <input required type="date" value={form.fecha} onChange={set('fecha')} className="input" />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Fuente (opcional)</label>
          <select value={form.fuenteId} onChange={set('fuenteId')} className="input">
            <option value="">Sin fuente específica</option>
            {fuentes.map(f => (
              <option key={f.id} value={f.id}>{f.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Descripción (opcional)</label>
          <input value={form.descripcion} onChange={set('descripcion')} className="input" placeholder="Bono, comisión..." />
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
        <button type="submit" className="btn-primary">Registrar</button>
      </div>
    </form>
  )
}
