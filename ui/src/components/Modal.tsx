import { useEffect } from 'react'

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="pop-in w-full max-w-md rounded-card bg-surface1 p-5 shadow-modal" role="dialog" aria-modal>
        <h2 className="mb-3 text-[15px] font-semibold text-ink">{title}</h2>
        {children}
      </div>
    </div>
  )
}
