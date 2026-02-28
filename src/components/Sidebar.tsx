'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import NotificationBell from '@/features/alertas/components/NotificationBell'

const links = [
  { href: '/', label: '📊 Dashboard' },
  { href: '/ingresos', label: '💰 Ingresos' },
  { href: '/gastos', label: '💸 Gastos' },
  { href: '/gastos-fijos', label: '🔒 Gastos fijos' },
  { href: '/creditos', label: '💳 Créditos' },
  { href: '/presupuestos', label: '💰 Presupuestos' },
  { href: '/reportes', label: '📊 Reportes' },
]

export default function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-56 min-h-screen bg-slate-900 border-r border-slate-700 flex flex-col shrink-0">
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-lg font-bold text-emerald-400 tracking-tight">FINANZAS</h1>
            <p className="text-xs text-slate-400 font-semibold tracking-widest">ARDEPA</p>
          </div>
          <NotificationBell />
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {links.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              pathname === link.href
                ? 'bg-emerald-500/20 text-emerald-400 font-medium'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <p className="text-xs text-slate-500">Bot Telegram activo</p>
        </div>
      </div>
    </aside>
  )
}
