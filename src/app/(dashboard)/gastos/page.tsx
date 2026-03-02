'use client'
import { useEffect, useState } from 'react'
import EmptyState from '@/components/ui/EmptyState'

const CATEGORIAS = ['ALIMENTACION', 'TRANSPORTE', 'ENTRETENIMIENTO', 'SALUD', 'SERVICIOS', 'OTROS'] as const
type Categoria = typeof CATEGORIAS[number]

const CATEGORIA_EMOJI: Record<Categoria, string> = {
  ALIMENTACION: '🍽️',
  TRANSPORTE: '🚗',
  ENTRETENIMIENTO: '🎬',
  SALUD: '💊',
  SERVICIOS: '🏠',
  OTROS: '📦',
}

const CATEGORIA_LABEL: Record<Categoria, string> = {
  ALIMENTACION: 'Alimentación',
  TRANSPORTE: 'Transporte',
  ENTRETENIMIENTO: 'Entretenimiento',
  SALUD: 'Salud',
  SERVICIOS: 'Servicios',
  OTROS: 'Otros',
}

interface Gasto {
  id: string
  descripcion: string
  monto: string | number
  categoria: Categoria
  fecha: string
  fuente: 'TELEGRAM' | 'WEB'
}

interface FormState {
  descripcion: string
  monto: string
  categoria: Categoria
  fecha: string
}

export default function GastosPage() {
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<Gasto | null>(null)
  const [filtro, setFiltro] = useState<Categoria | ''>('')
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<FormState>({
    descripcion: '',
    monto: '',
    categoria: 'ALIMENTACION',
    fecha: new Date().toISOString().slice(0, 10),
  })

  const cargar = async () => {
    setLoading(true)
    const params = filtro ? `?categoria=${filtro}` : ''
    const res = await fetch(`/api/gastos${params}`)
    const data = await res.json()
    setGastos(data)
    setLoading(false)
  }

  useEffect(() => { cargar() }, [filtro])

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const resetForm = () => {
    setForm({ descripcion: '', monto: '', categoria: 'ALIMENTACION', fecha: new Date().toISOString().slice(0, 10) })
    setEditando(null)
    setShowForm(false)
  }

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editando) {
      await fetch(`/api/gastos/${editando.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    } else {
      await fetch('/api/gastos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    }
    resetForm()
    cargar()
  }

  const eliminar = async (id: string) => {
    if (!confirm('¿Eliminar este gasto?')) return
    await fetch(`/api/gastos/${id}`, { method: 'DELETE' })
    cargar()
  }

  const iniciarEdicion = (g: Gasto) => {
    setEditando(g)
    setForm({
      descripcion: g.descripcion,
      monto: String(g.monto),
      categoria: g.categoria,
      fecha: new Date(g.fecha).toISOString().slice(0, 10),
    })
    setShowForm(true)
  }

  const total = gastos.reduce((s, g) => s + Number(g.monto), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">💸 Gastos</h1>
          <p className="text-slate-400 text-sm">
            {gastos.length} registros · Total: <span className="text-red-400 font-semibold">${total.toLocaleString('es-MX')} MXN</span>
          </p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="btn-primary">
          + Nuevo gasto
        </button>
      </div>

      {/* Category filter chips */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFiltro('')}
          className={`text-xs px-3 py-1.5 rounded-full transition-colors ${!filtro ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
        >
          Todos
        </button>
        {CATEGORIAS.map(c => (
          <button
            key={c}
            onClick={() => setFiltro(c)}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${filtro === c ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
          >
            {CATEGORIA_EMOJI[c]} {CATEGORIA_LABEL[c]}
          </button>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={guardar} className="card grid grid-cols-2 gap-4">
          <h3 className="col-span-2 font-semibold text-slate-100">{editando ? 'Editar gasto' : 'Nuevo gasto'}</h3>
          <div className="col-span-2">
            <label className="text-xs text-slate-400 block mb-1">Descripción</label>
            <input required value={form.descripcion} onChange={set('descripcion')} className="input" placeholder="Ej: Tacos de canasta" />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Monto (MXN)</label>
            <input required type="number" step="0.01" min="0.01" value={form.monto} onChange={set('monto')} className="input" placeholder="180" />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Categoría</label>
            <select value={form.categoria} onChange={set('categoria')} className="input">
              {CATEGORIAS.map(c => (
                <option key={c} value={c}>{CATEGORIA_EMOJI[c]} {CATEGORIA_LABEL[c]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Fecha</label>
            <input type="date" value={form.fecha} onChange={set('fecha')} className="input" />
          </div>
          <div className="flex gap-2 items-end">
            <button type="submit" className="btn-primary flex-1">{editando ? 'Actualizar' : 'Guardar'}</button>
            <button type="button" onClick={resetForm} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      )}

      {/* List */}
      {loading ? (
        <p className="text-slate-500">Cargando...</p>
      ) : gastos.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="💸"
            message={filtro ? `Sin gastos en ${CATEGORIA_LABEL[filtro]}` : 'Aún no hay gastos registrados'}
            description={filtro ? undefined : 'Registra gastos desde Telegram con /gasto o desde aquí'}
          />
        </div>
      ) : (
        <div className="space-y-2">
          {gastos.map(g => (
            <div key={g.id} className="bg-slate-800 rounded-lg px-4 py-3 border border-slate-700 flex items-center gap-4">
              <span className="text-2xl shrink-0">{CATEGORIA_EMOJI[g.categoria]}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-100 truncate">{g.descripcion}</p>
                <p className="text-xs text-slate-500">
                  {new Date(g.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {' · '}
                  {g.fuente === 'TELEGRAM' ? '📱 Telegram' : '🌐 Web'}
                </p>
              </div>
              <span className="text-sm font-semibold text-red-400 shrink-0">${Number(g.monto).toLocaleString('es-MX')}</span>
              <div className="flex gap-3 shrink-0">
                <button onClick={() => iniciarEdicion(g)} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Editar</button>
                <button onClick={() => eliminar(g.id)} className="text-xs text-red-400 hover:text-red-300 transition-colors">Borrar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
