interface EmptyStateProps {
  icon?: string
  message: string
  description?: string
  action?:
    | { label: string; href: string; onClick?: never }
    | { label: string; onClick: () => void; href?: never }
}

export default function EmptyState({ icon = '📭', message, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <span className="text-4xl mb-3" aria-hidden="true">{icon}</span>
      <p className="text-sm font-medium text-slate-300 mb-1">{message}</p>
      {description && <p className="text-xs text-slate-500 mb-4 max-w-xs">{description}</p>}
      {action && (
        action.href ? (
          <a href={action.href} className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
            {action.label} →
          </a>
        ) : (
          <button type="button" onClick={action.onClick} className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
            {action.label} →
          </button>
        )
      )}
    </div>
  )
}
