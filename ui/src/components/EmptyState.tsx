import clsx from 'clsx'

export function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
}: {
  icon: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  compact?: boolean
}) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center text-center',
        compact ? 'gap-1.5 px-4 py-8' : 'gap-2 px-4 py-16',
      )}
    >
      <div className="text-muted opacity-50" aria-hidden>
        {icon}
      </div>
      <div className="text-[13px] font-medium text-sec">{title}</div>
      {description && <div className="max-w-xs text-xxs leading-relaxed text-muted">{description}</div>}
      {action && <div className="mt-2 flex items-center gap-2">{action}</div>}
    </div>
  )
}
