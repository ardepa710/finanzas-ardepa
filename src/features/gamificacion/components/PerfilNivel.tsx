interface Perfil {
  nivelActual: number
  nivelNombre: string
  xpTotal: number
  xpSiguiente: number
  progresoPct: number
}

export default function PerfilNivel({ perfil }: { perfil: Perfil }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center">
          <span className="text-2xl font-bold text-emerald-400">{perfil.nivelActual}</span>
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider">Nivel {perfil.nivelActual}</p>
          <h2 className="text-xl font-bold text-slate-100">{perfil.nivelNombre}</h2>
          <p className="text-sm text-slate-400">{perfil.xpTotal} XP total</p>
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Progreso al siguiente nivel</span>
          <span>{perfil.progresoPct}%</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            data-testid="xp-bar"
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${perfil.progresoPct}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 text-right">{perfil.xpSiguiente} XP para siguiente nivel</p>
      </div>
    </div>
  )
}
