import { useEffect, useRef } from 'react'

export function isEditableTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  const tag = el.tagName
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    el.isContentEditable
  )
}

export interface GlobalKeyHandlers {
  openPalette: (mode?: 'default' | 'search' | 'table') => void
  goDashboard?: () => void
  goAudit?: () => void
  showHelp?: () => void
}

export function useGlobalKeys(handlers: GlobalKeyHandlers): void {
  const ref = useRef(handlers)
  ref.current = handlers
  const leader = useRef<{ key: string; at: number } | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const h = ref.current
      const meta = e.metaKey || e.ctrlKey

      if (meta && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        h.openPalette('default')
        return
      }
      if (isEditableTarget(e.target)) return

      if (e.key === '/' && !meta) {
        e.preventDefault()
        h.openPalette('search')
        return
      }
      if (e.key === '?' && !meta) {
        e.preventDefault()
        h.showHelp?.()
        return
      }

      const now = Date.now()
      if (leader.current && now - leader.current.at < 700 && leader.current.key === 'g') {
        leader.current = null
        if (e.key === 'd') {
          e.preventDefault()
          h.goDashboard?.()
          return
        }
        if (e.key === 'a') {
          e.preventDefault()
          h.goAudit?.()
          return
        }
        if (e.key === 't') {
          e.preventDefault()
          h.openPalette('table')
          return
        }
        return
      }
      if (e.key === 'g' && !meta) {
        leader.current = { key: 'g', at: now }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
