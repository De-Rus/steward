import { useState } from 'react'
import { IconChevronDown, IconChevronRight } from './Icons'

function Node({ name, value, depth }: { name: string | null; value: unknown; depth: number }) {
  const [open, setOpen] = useState(false)
  const isObj = value !== null && typeof value === 'object'

  if (!isObj) {
    return (
      <div className="flex gap-1.5" style={{ paddingLeft: depth * 14 }}>
        {name !== null && <span className="text-muted">{name}:</span>}
        <span className="text-sec">{JSON.stringify(value)}</span>
      </div>
    )
  }

  const entries = Array.isArray(value)
    ? value.map((v, i) => [String(i), v] as const)
    : Object.entries(value as Record<string, unknown>)
  const summary = Array.isArray(value) ? `[${entries.length}]` : `{${entries.length}}`

  return (
    <div style={{ paddingLeft: depth * 14 }}>
      <button
        type="button"
        className="flex items-center gap-1 text-sec hover:text-ink"
        onClick={() => setOpen(!open)}
      >
        {open ? <IconChevronDown size={11} /> : <IconChevronRight size={11} />}
        {name !== null && <span className="text-muted">{name}:</span>}
        <span className="text-muted">{summary}</span>
      </button>
      {open &&
        entries.map(([k, v]) => <Node key={k} name={k} value={v} depth={1} />)}
    </div>
  )
}

export function JsonTree({ value }: { value: unknown }) {
  return (
    <div className="font-mono text-xs leading-5">
      <Node name={null} value={value} depth={0} />
    </div>
  )
}
