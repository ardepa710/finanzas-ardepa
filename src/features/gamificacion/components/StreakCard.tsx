interface StreakData {
  tipo: string
  rachaActual: number
  rachaMayor: number
  ultimaActividad: string | null
}

export default function StreakCard({ streak }: { streak: StreakData }) {
  const label = streak.tipo === 'GASTOS_DIARIOS' ? 'Gastos diarios' : 'Contribuciones a metas'
  const isActive = streak.ultimaActividad
    ? new Date(streak.ultimaActividad).toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10)
    : false

  return (
    <div className={`bg-slate-800 border rounded-xl p-4 flex items-center gap-4 ${isActive ? 'border-orange-500/40' : 'border-slate-700'}`}>
      <span className="text-3xl">{isActive ? '🔥' : '💤'}</span>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-2xl font-bold text-slate-100">{streak.rachaActual} <span className="text-sm font-normal text-slate-400">días</span></p>
        <p className="text-xs text-slate-500">Récord: {streak.rachaMayor} días</p>
      </div>
    </div>
  )
}
