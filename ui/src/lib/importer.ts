import type { ImportResult, Row } from '../api/types'

export type ImportFormat = 'csv' | 'json'
export type ImportMode = 'insert' | 'upsert'

export function detectFormat(name: string, raw: string): ImportFormat {
  if (/\.json$/i.test(name)) return 'json'
  if (/\.csv$/i.test(name)) return 'csv'
  const trimmed = raw.trimStart()
  return trimmed.startsWith('[') || trimmed.startsWith('{') ? 'json' : 'csv'
}

export function parseCsv(raw: string): { headers: string[]; rows: string[][] } {
  const records: string[][] = []
  let field = ''
  let record: string[] = []
  let inQuotes = false
  const text = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      record.push(field)
      field = ''
    } else if (c === '\n') {
      record.push(field)
      records.push(record)
      record = []
      field = ''
    } else {
      field += c
    }
  }
  if (field !== '' || record.length > 0) {
    record.push(field)
    records.push(record)
  }
  const nonEmpty = records.filter((r) => !(r.length === 1 && r[0].trim() === ''))
  const headers = nonEmpty.length ? nonEmpty[0].map((h) => h.trim()) : []
  return { headers, rows: nonEmpty.slice(1) }
}

function coerce(v: string): unknown {
  const s = v.trim()
  if (s === '') return null
  if (s === 'true') return true
  if (s === 'false') return false
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s)
  return v
}

export interface ImportPreview {
  format: ImportFormat
  columns: string[]
  rows: Row[]
  count: number
  error: string | null
}

export function previewImport(format: ImportFormat, raw: string): ImportPreview {
  if (raw.trim() === '') {
    return { format, columns: [], rows: [], count: 0, error: null }
  }
  if (format === 'json') {
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch (e) {
      return { format, columns: [], rows: [], count: 0, error: e instanceof Error ? e.message : 'JSON inválido' }
    }
    const arr = Array.isArray(parsed) ? parsed : [parsed]
    const rows = arr.filter((r): r is Row => r != null && typeof r === 'object' && !Array.isArray(r))
    const columns: string[] = []
    for (const r of rows) for (const k of Object.keys(r)) if (!columns.includes(k)) columns.push(k)
    return { format, columns, rows, count: rows.length, error: null }
  }
  const { headers, rows: cells } = parseCsv(raw)
  if (headers.length === 0) return { format, columns: [], rows: [], count: 0, error: 'CSV vacío' }
  const rows: Row[] = cells.map((cols) => {
    const r: Row = {}
    headers.forEach((h, i) => {
      r[h] = coerce(cols[i] ?? '')
    })
    return r
  })
  return { format, columns: headers, rows, count: rows.length, error: null }
}

export function summarizeImport(res: ImportResult): string {
  const parts: string[] = []
  if (res.inserted) parts.push(`${res.inserted} nuevas`)
  if (res.updated) parts.push(`${res.updated} actualizadas`)
  if (res.skipped) parts.push(`${res.skipped} omitidas`)
  if (res.errors.length) parts.push(`${res.errors.length} errores`)
  return parts.join(' · ') || 'sin cambios'
}
