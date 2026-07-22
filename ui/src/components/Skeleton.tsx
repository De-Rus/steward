import clsx from 'clsx'

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={clsx('skeleton', className)} style={style} />
}

export function TableSkeleton({ cols, rows = 12 }: { cols: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} style={{ height: 'var(--row-h)' }} className="border-t">
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="px-2.5">
              <Skeleton className="h-3.5" style={{ width: `${40 + ((r + c) % 4) * 15}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export function CardSkeleton({ lines = 6 }: { lines?: number }) {
  return (
    <div className="card grid grid-cols-1 gap-x-10 gap-y-4 p-5 md:grid-cols-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i}>
          <Skeleton className="mb-2 h-2.5 w-24" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  )
}
