import { createContext, useCallback, useContext, useRef, useState } from 'react'
import clsx from 'clsx'
import { IconAlert, IconCheck } from './Icons'

interface ToastAction {
  label: string
  onClick: () => void
}

interface ToastItem {
  id: number
  msg: string
  kind: 'ok' | 'error'
  action?: ToastAction
}

type ToastOpts = { kind?: 'ok' | 'error'; action?: ToastAction }
type ToastFn = (msg: string, kindOrOpts?: 'ok' | 'error' | ToastOpts) => void

const ToastContext = createContext<ToastFn>(() => {})

export function useToast(): ToastFn {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(1)
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id))
    const tm = timers.current.get(id)
    if (tm) clearTimeout(tm)
    timers.current.delete(id)
  }, [])

  const arm = useCallback(
    (id: number, ms: number) => {
      const existing = timers.current.get(id)
      if (existing) clearTimeout(existing)
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), ms),
      )
    },
    [dismiss],
  )

  const push = useCallback<ToastFn>(
    (msg, kindOrOpts) => {
      const opts: ToastOpts = typeof kindOrOpts === 'string' ? { kind: kindOrOpts } : kindOrOpts ?? {}
      const id = nextId.current++
      const item: ToastItem = { id, msg, kind: opts.kind ?? 'ok', action: opts.action }
      setToasts((t) => [...t, item].slice(-3))
      arm(id, item.action ? 6000 : 4000)
    },
    [arm],
  )

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col gap-2"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.kind === 'error' ? 'alert' : 'status'}
            className={clsx(
              'toast pointer-events-auto flex items-center gap-2 rounded-card bg-surface1 px-3.5 py-2.5 text-[13px] shadow-menu',
              t.kind === 'error' ? 'text-critical' : 'text-ink',
            )}
            onMouseEnter={() => {
              const tm = timers.current.get(t.id)
              if (tm) clearTimeout(tm)
            }}
            onMouseLeave={() => arm(t.id, 2000)}
            onClick={() => dismiss(t.id)}
          >
            {t.kind === 'error' ? (
              <IconAlert size={15} className="shrink-0 text-critical" />
            ) : (
              <IconCheck size={15} className="shrink-0 text-good" />
            )}
            <span>{t.msg}</span>
            {t.action && (
              <button
                type="button"
                className="ml-1 font-medium text-accent hover:underline"
                onClick={(e) => {
                  e.stopPropagation()
                  t.action!.onClick()
                  dismiss(t.id)
                }}
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
