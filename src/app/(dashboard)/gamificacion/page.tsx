'use client'
import { usePerfil, useLogros, useStreaks, useCheckLogros } from '@/features/gamificacion/hooks/useGamificacion'
import PerfilNivel from '@/features/gamificacion/components/PerfilNivel'
import LogrosGrid from '@/features/gamificacion/components/LogrosGrid'
import StreakCard from '@/features/gamificacion/components/StreakCard'
import { useEffect } from 'react'

export default function GamificacionPage() {
  const { data: perfil, isLoading: loadingPerfil } = usePerfil()
  const { data: logros, isLoading: loadingLogros } = useLogros()
  const { data: streaks, isLoading: loadingStreaks } = useStreaks()
  const checkLogros = useCheckLogros()

  useEffect(() => {
    checkLogros.mutate()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-xl font-bold text-slate-100">🏆 Gamificación</h1>

      {loadingPerfil ? (
        <div className="h-32 bg-slate-800 rounded-2xl animate-pulse" />
      ) : perfil ? (
        <PerfilNivel perfil={perfil} />
      ) : null}

      <section>
        <h2 className="text-base font-semibold text-slate-200 mb-3">Rachas Activas</h2>
        {loadingStreaks ? (
          <div className="h-20 bg-slate-800 rounded-xl animate-pulse" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {streaks?.map((s: any) => <StreakCard key={s.tipo} streak={s} />)}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-base font-semibold text-slate-200 mb-3">Logros</h2>
        {loadingLogros ? (
          <div className="h-48 bg-slate-800 rounded-xl animate-pulse" />
        ) : logros ? (
          <LogrosGrid logros={logros} />
        ) : null}
      </section>
    </div>
  )
}
