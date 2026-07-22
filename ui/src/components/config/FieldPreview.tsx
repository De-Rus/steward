import { useMemo } from 'react'
import type { ColumnMeta, Row } from '../../api/types'
import type { Json } from '../../lib/configModel'
import { useT } from '../../lib/i18n'
import { CellValue } from '../CellValue'

const SAMPLE_UUID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301'

export function syntheticValue(kind: string, widget: string): unknown {
  switch (widget) {
    case 'toggle':
      return true
    case 'badge':
      return 'active'
    case 'money':
      return 1234.5
    case 'percent':
      return 12.4
    case 'number':
      return 42
    case 'duration':
      return 3720
    case 'datetime':
    case 'relative_time':
      return new Date(Date.now() - 3600_000).toISOString()
    case 'uuid':
      return SAMPLE_UUID
    case 'json':
      return { key: 'value', n: 3 }
    case 'code':
      return 'select 1;'
    case 'array':
      return ['alpha', 'beta']
    case 'pill':
      return 'active'
    case 'tags':
      return ['alpha', 'beta', 'gamma']
    case 'bytes':
      return 5 * 1024 * 1024
    case 'progress':
      return 68
    case 'rating':
      return 4
    case 'trend':
      return 3.2
    case 'heatcell':
      return 72
    case 'link':
    case 'url':
      return 'https://example.com'
    case 'email':
      return 'user@example.com'
    case 'phone':
      return '+34600123123'
    case 'avatar':
      return 'https://example.com/favicon.ico'
    case 'color':
      return '#3987e5'
    case 'country':
    case 'flag':
      return 'US'
    case 'copyable':
      return SAMPLE_UUID
    case 'truncate':
      return 'The quick brown fox jumps over the lazy dog and keeps running'
  }
  switch (kind) {
    case 'int':
    case 'float':
      return 42
    case 'bool':
      return true
    case 'datetime':
      return new Date(Date.now() - 3600_000).toISOString()
    case 'uuid':
      return SAMPLE_UUID
    case 'json':
      return { key: 'value' }
    case 'array':
      return ['alpha', 'beta']
    default:
      return 'Sample'
  }
}

export function sampleValuesFor(
  column: ColumnMeta,
  sampleRows: readonly Row[],
  widget: string,
  count = 3,
): unknown[] {
  const real: unknown[] = []
  for (const row of sampleRows) {
    const v = row[column.name]
    if (v !== null && v !== undefined) real.push(v)
    if (real.length >= count) break
  }
  if (real.length) return real
  return [syntheticValue(column.kind, widget)]
}

export function FieldPreview({
  column,
  widget,
  params,
  sampleValues,
}: {
  column: ColumnMeta
  widget: string
  params: Record<string, Json> | undefined
  sampleValues: readonly unknown[]
}) {
  const t = useT()
  const col = useMemo<ColumnMeta>(
    () => ({ ...column, widget, params: (params ?? {}) as Record<string, unknown> }),
    [column, widget, params],
  )
  return (
    <div className="space-y-1">
      <span className="text-xxs font-medium uppercase tracking-wide text-muted">
        {t('cfg_field_preview')}
      </span>
      <div className="flex flex-wrap items-center gap-2">
        {sampleValues.map((value, i) => (
          <span
            key={i}
            className="inline-flex items-center rounded-ctl border bg-page px-2 py-1 text-[13px]"
          >
            <CellValue col={col} value={value} row={{}} mode="list" />
          </span>
        ))}
      </div>
    </div>
  )
}
