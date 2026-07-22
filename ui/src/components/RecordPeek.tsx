import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { api } from '../api/client'
import type { ColumnMeta, TableMeta } from '../api/types'
import { fmtInt, interpolate } from '../lib/format'
import { detailLayout } from '../lib/sections'
import { rowQueryKey } from '../lib/prefetch'
import { useT } from '../lib/i18n'
import { CellValue } from './CellValue'
import { EmptyState } from './EmptyState'
import { CardSkeleton } from './Skeleton'
import { IconChevronRight, IconInbox, IconReturn, IconX } from './Icons'

const PEEK_SKIP_WIDGETS = new Set(['binary'])

export function RecordPeek({
  table,
  pk,
  index,
  total,
  atStart,
  atEnd,
  onClose,
  onPrev,
  onNext,
  onOpenFull,
}: {
  table: TableMeta
  pk: string
  index: number
  total: number
  atStart: boolean
  atEnd: boolean
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  onOpenFull: () => void
}) {
  const t = useT()
  const { data, isLoading, isError } = useQuery({
    queryKey: rowQueryKey(table.name, pk),
    queryFn: () => api.row(table.name, pk),
    enabled: !!pk,
  })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      switch (e.key) {
        case 'Escape':
          e.preventDefault()
          e.stopPropagation()
          onClose()
          break
        case 'ArrowDown':
        case 'j':
          e.preventDefault()
          e.stopPropagation()
          if (!atEnd) onNext()
          break
        case 'ArrowUp':
        case 'k':
          e.preventDefault()
          e.stopPropagation()
          if (!atStart) onPrev()
          break
        case 'Enter':
          e.preventDefault()
          e.stopPropagation()
          onOpenFull()
          break
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [atStart, atEnd, onClose, onPrev, onNext, onOpenFull])

  const title = data?.row ? interpolate(table.display_title, data.row) : pk
  const keep = (c: ColumnMeta) => !PEEK_SKIP_WIDGETS.has(c.widget) && c.widget !== 'image'
  const layout = detailLayout(table)
  const byName = new Map(table.columns.map((c) => [c.name, c]))
  const groups = layout.groups
    .map((g) => ({ title: g.title, cols: g.columns.filter(keep) }))
    .filter((g) => g.cols.length > 0)
  const metaCols = layout.sidebarFields
    .map((n) => byName.get(n))
    .filter((c): c is ColumnMeta => !!c && keep(c))

  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-label={title || pk}>
      <button
        type="button"
        className="absolute inset-0 bg-black/30"
        aria-label={t('cancel')}
        onClick={onClose}
        tabIndex={-1}
      />
      <div className="sheet-in relative flex h-full w-full max-w-[460px] flex-col border-l bg-surface1 shadow-modal">
        <div className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[15px] font-semibold text-ink">{title || pk}</h2>
          </div>
          {total > 1 && (
            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded-ctl text-muted hover:bg-hover hover:text-ink disabled:opacity-40"
                onClick={onPrev}
                disabled={atStart}
                aria-label={t('prev')}
                title={`${t('prev')} (↑)`}
              >
                <IconChevronRight size={15} className="-rotate-90" />
              </button>
              <span className="text-xxs tabular-nums text-muted">
                {fmtInt(index + 1)}/{fmtInt(total)}
              </span>
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded-ctl text-muted hover:bg-hover hover:text-ink disabled:opacity-40"
                onClick={onNext}
                disabled={atEnd}
                aria-label={t('next')}
                title={`${t('next')} (↓)`}
              >
                <IconChevronRight size={15} className="rotate-90" />
              </button>
            </div>
          )}
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-ctl text-muted hover:bg-hover hover:text-ink"
            onClick={onClose}
            aria-label={t('cancel')}
            title="Esc"
          >
            <IconX size={15} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-4">
          {isLoading && <CardSkeleton lines={6} />}
          {isError && (
            <EmptyState icon={<IconX size={24} />} title={t('row_not_found')} compact />
          )}
          {data?.row && (
            <div className="space-y-3">
              {groups.map((g) => (
                <section key={g.title || '_main'} className="overflow-hidden rounded-card border bg-surface1">
                  {g.title && (
                    <div className="border-b bg-surface2/40 px-3.5 py-2">
                      <h3 className="text-xxs font-semibold uppercase tracking-wider text-sec">{g.title}</h3>
                    </div>
                  )}
                  <dl className="divide-y">
                    {g.cols.map((col) => (
                      <PeekField key={col.name} col={col} row={data.row} table={table} />
                    ))}
                  </dl>
                </section>
              ))}

              {metaCols.length > 0 && (
                <section className="overflow-hidden rounded-card border bg-surface2/50">
                  <dl className="divide-y">
                    {metaCols.map((col) => (
                      <PeekField key={col.name} col={col} row={data.row} table={table} muted />
                    ))}
                  </dl>
                </section>
              )}

              {data.inlines.length > 0 && (
                <div className="space-y-1.5 border-t pt-3">
                  {data.inlines.map((inline) => {
                    const fkVal = String(inline.rows[0]?.[inline.fk_col] ?? pk)
                    return (
                      <Link
                        key={`${inline.table}-${inline.fk_col}`}
                        to={`/${inline.table}?f_${inline.fk_col}=${encodeURIComponent(fkVal)}`}
                        className="flex items-center justify-between rounded-ctl px-2 py-1.5 text-[13px] text-sec hover:bg-hover hover:text-ink"
                      >
                        <span className="flex items-center gap-2">
                          <IconInbox size={14} className="text-muted" />
                          {inline.label}
                        </span>
                        <span className="flex items-center gap-1 tabular-nums text-muted">
                          {inline.total > 0 ? fmtInt(inline.total) : ''}
                          {inline.total === 0 && <span className="text-xxs">{t('no_related')}</span>}
                          <IconChevronRight size={12} />
                        </span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-2 border-t px-4 py-2.5">
          <span className="flex items-center gap-1.5 text-xxs text-muted">
            <span className="kbd">↑</span>
            <span className="kbd">↓</span>
            <span>{t('nav_move')}</span>
            <span className="kbd ml-1">Esc</span>
          </span>
          <button type="button" className="btn btn-primary" onClick={onOpenFull}>
            <IconReturn size={13} /> {t('peek_open_full')}
          </button>
        </div>
      </div>
    </div>
  )
}

const BLOCK_WIDGETS = new Set(['code', 'textarea', 'json', 'markdown', 'html', 'array', 'image'])

function PeekField({
  col,
  row,
  table,
  muted,
}: {
  col: ColumnMeta
  row: Record<string, unknown>
  table: TableMeta
  muted?: boolean
}) {
  const label = col.label ?? col.name
  const value = (
    <CellValue col={col} value={row[col.name]} row={row} mode="detail" pkName={table.pk} tableName={table.name} />
  )

  if (BLOCK_WIDGETS.has(col.widget)) {
    return (
      <div className="px-3.5 py-2.5">
        <dt
          className={clsx(
            'mb-1.5 text-[11px] font-medium',
            muted ? 'text-muted/70' : 'text-muted',
          )}
        >
          {label}
        </dt>
        <dd className="min-w-0 text-[13px] leading-relaxed text-ink [overflow-wrap:anywhere]">{value}</dd>
      </div>
    )
  }

  return (
    <div className="flex items-baseline gap-3 px-3.5 py-2">
      <dt
        className={clsx(
          'w-[7.5rem] shrink-0 truncate text-[11px] font-medium',
          muted ? 'text-muted/70' : 'text-muted',
        )}
        title={label}
      >
        {label}
      </dt>
      <dd className="min-w-0 flex-1 text-[13px] text-ink [overflow-wrap:anywhere]">{value}</dd>
    </div>
  )
}
