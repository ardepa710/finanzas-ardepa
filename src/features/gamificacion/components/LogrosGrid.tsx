import type { LogroConEstado } from '../types'

export default function LogrosGrid({ logros }: { logros: LogroConEstado[] }) {
  const desbloqueados = logros.filter(l => l.desbloqueado)
  const bloqueados = logros.filter(l => !l.desbloqueado)

  return (
    <div>
      <p className="text-sm text-slate-400 mb-3">
        {desbloqueados.length}/{logros.length} logros desbloqueados
      </p>
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        {[...desbloqueados, ...bloqueados].map(logro => (
          <div
            key={logro.codigo}
            title={`${logro.nombre}: ${logro.descripcion} (+${logro.xp} XP)`}
            className={`flex flex-col items-center p-3 rounded-xl border transition-all ${
              logro.desbloqueado
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                : 'bg-slate-800/40 border-slate-700 text-slate-600 grayscale opacity-40'
            }`}
          >
            <span className="text-2xl mb-1">{logro.icono}</span>
            <span className="text-xs text-center leading-tight font-medium">{logro.nombre}</span>
            <span className="text-xs mt-1 opacity-70">+{logro.xp} XP</span>
          </div>
        ))}
      </div>
    </div>
  )
}
