import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMeta } from '../lib/meta'
import { useT } from '../lib/i18n'
import { loadWidgetModule, pageElementName, widgetApi } from '../lib/widgets'

export default function CustomPage() {
  const { '*': id = '' } = useParams()
  const meta = useMeta()
  const t = useT()
  const page = meta.pages?.find((p) => p.id === id)
  const hostRef = useRef<HTMLDivElement>(null)
  const elRef = useRef<HTMLElement | null>(null)
  const [failed, setFailed] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setFailed(false)
    setReady(false)
    elRef.current = null
    if (!page || !page.module) {
      setFailed(true)
      return
    }
    let cancelled = false
    const tag = pageElementName(page.slug)
    loadWidgetModule(page.module, page.slug)
      .then(() => customElements.whenDefined(tag))
      .then(() => {
        if (cancelled) return
        if (!customElements.get(tag)) {
          setFailed(true)
          return
        }
        setReady(true)
      })
      .catch(() => !cancelled && setFailed(true))
    return () => {
      cancelled = true
    }
  }, [page])

  useEffect(() => {
    if (!ready || failed || !page) return
    const host = hostRef.current
    if (!host) return
    const tag = pageElementName(page.slug)
    if (!elRef.current) {
      elRef.current = document.createElement(tag)
      host.replaceChildren(elRef.current)
    }
    const el = elRef.current as HTMLElement & { api?: unknown; params?: unknown }
    el.api = widgetApi
    el.params = {}
  }, [ready, failed, page])

  if (failed) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="card px-6 py-4 text-sm text-critical">{t('page_load_failed')}</div>
      </div>
    )
  }

  return <div ref={hostRef} className="h-full w-full" />
}
