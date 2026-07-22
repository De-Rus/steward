import type { ColumnMeta, Row } from '../api/types'

export function coerceValue(col: ColumnMeta, raw: unknown): unknown {
  if (raw === '' || raw === null || raw === undefined) return null
  switch (col.widget) {
    case 'toggle':
      return raw === true || raw === 'true' || raw === 1 || raw === '1'
    case 'number':
    case 'money':
    case 'percent':
    case 'duration': {
      const n = typeof raw === 'number' ? raw : Number(raw)
      return Number.isNaN(n) ? null : n
    }
    case 'array':
      if (Array.isArray(raw)) return raw
      return String(raw)
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s !== '')
    case 'json':
      if (typeof raw !== 'string') return raw
      try {
        return JSON.parse(raw)
      } catch {
        return raw
      }
    default:
      return raw
  }
}

export function editorString(col: ColumnMeta, value: unknown): string {
  if (value === null || value === undefined) return ''
  if (col.widget === 'array' && Array.isArray(value)) return value.join(', ')
  if (col.widget === 'json') return JSON.stringify(value)
  return String(value)
}

export function buildBulkSet(col: ColumnMeta, raw: unknown): Row {
  return { [col.name]: coerceValue(col, raw) }
}

const INLINE_WIDGETS = new Set(['text', 'textarea', 'number', 'money', 'percent', 'duration', 'toggle', 'badge', 'datetime', 'fk'])

export function isInlineEditable(col: ColumnMeta): boolean {
  return INLINE_WIDGETS.has(col.widget)
}
