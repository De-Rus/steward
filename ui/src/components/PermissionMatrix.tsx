import { useMemo, useState } from 'react'
import clsx from 'clsx'
import type { RolePerm } from '../api/types'
import type { CrudKey, Level, MatrixModel, MatrixRow } from '../lib/access'
import { actionTable, CRUD_KEYS, effectivePerm } from '../lib/access'
import { useT } from '../lib/i18n'
import { ColumnMultiSelect } from './config/pickers'
import { IconChevronDown, IconChevronRight } from './Icons'

type Tri = 'inherit' | 'allow' | 'deny'

const CRUD_LABEL: Record<CrudKey, string> = {
  view: 'matrix_crud_view',
  create: 'matrix_crud_create',
  update: 'matrix_crud_update',
  delete: 'matrix_crud_delete',
}

function triOf(perm: RolePerm | undefined, key: CrudKey): Tri {
  const v = perm?.[key]
  return v === undefined ? 'inherit' : v ? 'allow' : 'deny'
}

function cycleTri(s: Tri): Tri {
  return s === 'inherit' ? 'allow' : s === 'allow' ? 'deny' : 'inherit'
}

function setTri(perm: RolePerm | undefined, key: CrudKey, tri: Tri): RolePerm | undefined {
  const next: RolePerm = { ...perm }
  if (tri === 'inherit') delete next[key]
  else next[key] = tri === 'allow'
  return Object.keys(next).length > 0 ? next : undefined
}

function triCls(tri: Tri): string {
  if (tri === 'allow') return 'border-transparent accent-soft'
  if (tri === 'deny') return 'border-critical text-critical'
  return 'text-muted'
}

function CrudControl({
  label,
  tri,
  effective,
  readOnly,
  onCycle,
}: {
  label: string
  tri: Tri
  effective: boolean
  readOnly: boolean
  onCycle: () => void
}) {
  const t = useT()
  const tag =
    tri === 'inherit' ? (
      <span className="text-muted">{effective ? '✓' : '✕'}</span>
    ) : (
      <span>{t(tri === 'allow' ? 'matrix_allow' : 'matrix_deny')}</span>
    )
  const cls = clsx(
    'inline-flex items-center gap-1 rounded-full border px-2 py-px text-xxs font-medium',
    triCls(tri),
  )
  const inner = (
    <>
      <span>{label}</span>
      {tag}
    </>
  )
  if (readOnly) return <span className={cls}>{inner}</span>
  return (
    <button
      type="button"
      onClick={onCycle}
      title={t(tri === 'inherit' ? 'matrix_inherit' : tri === 'allow' ? 'matrix_allow' : 'matrix_deny')}
      className={clsx(cls, 'transition-colors')}
    >
      {inner}
    </button>
  )
}

const LEVELS: Level[] = ['none', 'read', 'write']

const LEVEL_LABEL: Record<Level, string> = {
  none: 'matrix_none',
  read: 'matrix_read',
  write: 'matrix_write',
}

function levelActiveCls(level: Level, active: boolean): string {
  if (!active) return 'text-muted'
  if (level === 'write') return 'accent-soft'
  if (level === 'read') return 'bg-surface3 text-ink'
  return 'bg-surface3 text-sec'
}

function Segmented({
  value,
  onChange,
  readOnly,
}: {
  value: Level
  onChange?: (l: Level) => void
  readOnly: boolean
}) {
  const t = useT()
  if (readOnly) {
    return (
      <span
        className={clsx(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xxs font-medium',
          value === 'none' ? 'text-muted' : levelActiveCls(value, true),
        )}
      >
        {t(LEVEL_LABEL[value])}
      </span>
    )
  }
  return (
    <div className="inline-flex overflow-hidden rounded-ctl border bg-page p-0.5" role="radiogroup">
      {LEVELS.map((l) => {
        const active = value === l
        return (
          <button
            key={l}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange?.(l)}
            className={clsx(
              'rounded-[6px] px-2.5 py-1 text-xxs font-medium transition-colors',
              active ? levelActiveCls(l, true) : 'text-muted hover:text-sec',
            )}
          >
            {t(LEVEL_LABEL[l])}
          </button>
        )
      })}
    </div>
  )
}

function ColumnPills({ cols, empty }: { cols: string[]; empty: string }) {
  if (cols.length === 0) return <span className="text-xxs text-muted">{empty}</span>
  return (
    <div className="flex flex-wrap gap-1">
      {cols.map((c) => (
        <span key={c} className="badge" style={{ '--badge-c': 'var(--badge-gray)' } as React.CSSProperties}>
          {c}
        </span>
      ))}
    </div>
  )
}

function AdvancedPanel({
  row,
  columns,
  readOnly,
  onChange,
}: {
  row: MatrixRow
  columns: string[]
  readOnly: boolean
  onChange: (patch: Partial<MatrixRow>) => void
}) {
  const t = useT()
  const colOptions = useMemo(() => columns.map((name) => ({ name })), [columns])
  const eff = effectivePerm(row.level)
  return (
    <div className="space-y-3 border-t bg-surface2 px-3 py-3">
      <div>
        <div className="mb-1 text-xxs font-semibold uppercase tracking-wide text-muted">
          {t('matrix_adv_perms')}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CRUD_KEYS.map((k) => (
            <CrudControl
              key={k}
              label={t(CRUD_LABEL[k])}
              tri={triOf(row.perm, k)}
              effective={eff[k]}
              readOnly={readOnly}
              onCycle={() => onChange({ perm: setTri(row.perm, k, cycleTri(triOf(row.perm, k))) })}
            />
          ))}
        </div>
      </div>
      <div>
        <div className="mb-1 text-xxs font-semibold uppercase tracking-wide text-muted">
          {t('matrix_editable')}
        </div>
        {readOnly ? (
          <ColumnPills cols={row.editableCols ?? []} empty={t('matrix_no_extra')} />
        ) : (
          <ColumnMultiSelect
            columns={colOptions}
            value={row.editableCols ?? []}
            onChange={(editableCols) => onChange({ editableCols })}
            placeholder={t('picker_pick_columns')}
            ariaLabel={t('matrix_editable')}
          />
        )}
      </div>
      <div>
        <div className="mb-1 text-xxs font-semibold uppercase tracking-wide text-muted">
          {t('matrix_masked')}
        </div>
        {readOnly ? (
          <ColumnPills cols={row.masked} empty={t('matrix_no_extra')} />
        ) : (
          <ColumnMultiSelect
            columns={colOptions}
            value={row.masked}
            onChange={(masked) => onChange({ masked })}
            placeholder={t('matrix_masked_hint')}
            ariaLabel={t('matrix_masked')}
          />
        )}
      </div>
      <div>
        <div className="mb-1 text-xxs font-semibold uppercase tracking-wide text-muted">
          {t('matrix_row_filter')}
        </div>
        {readOnly ? (
          row.rowFilter ? (
            <code className="block whitespace-pre-wrap break-words rounded-ctl bg-page px-2 py-1.5 font-mono text-[12px] text-sec">
              {row.rowFilter}
            </code>
          ) : (
            <span className="text-xxs text-muted">{t('matrix_no_extra')}</span>
          )
        ) : (
          <input
            className="input-sm w-full font-mono"
            value={row.rowFilter}
            placeholder={t('matrix_row_filter_ph')}
            onChange={(e) => onChange({ rowFilter: e.target.value })}
          />
        )}
      </div>
    </div>
  )
}

function TableRow({
  row,
  columns,
  readOnly,
  onChange,
}: {
  row: MatrixRow
  columns: string[]
  readOnly: boolean
  onChange: (patch: Partial<MatrixRow>) => void
}) {
  const [open, setOpen] = useState(false)
  const hasExtra =
    row.masked.length > 0 ||
    row.rowFilter.trim() !== '' ||
    (row.perm && Object.keys(row.perm).length > 0) ||
    (row.editableCols?.length ?? 0) > 0
  return (
    <>
      <div className="flex items-center gap-3 px-3 py-2">
        <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-ink">{row.table}</span>
        <Segmented value={row.level} readOnly={readOnly} onChange={(level) => onChange({ level })} />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={clsx(
            'flex h-6 items-center gap-1 rounded-ctl px-1.5 text-xxs',
            hasExtra ? 'text-accent' : 'text-muted hover:text-sec',
          )}
          aria-expanded={open}
        >
          {open ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
          {hasExtra && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
        </button>
      </div>
      {open && <AdvancedPanel row={row} columns={columns} readOnly={readOnly} onChange={onChange} />}
    </>
  )
}

export function PermissionMatrix({
  model,
  actions,
  columnsFor,
  onChange,
}: {
  model: MatrixModel
  actions: string[]
  columnsFor?: (table: string) => string[]
  onChange?: (m: MatrixModel) => void
}) {
  const t = useT()
  const readOnly = !onChange
  const [filter, setFilter] = useState('')

  const patchRow = (idx: number, patch: Partial<MatrixRow>) => {
    if (!onChange) return
    const rows = model.rows.map((r, i) => (i === idx ? { ...r, ...patch } : r))
    onChange({ ...model, rows })
  }

  const toggleAction = (a: string) => {
    if (!onChange) return
    const on = model.actions.includes(a)
    onChange({ ...model, actions: on ? model.actions.filter((x) => x !== a) : [...model.actions, a] })
  }

  const f = filter.trim().toLowerCase()
  const visible = model.rows
    .map((row, idx) => ({ row, idx }))
    .filter(({ row }) => !f || row.table.toLowerCase().includes(f))

  const cols = (table: string) => (columnsFor ? columnsFor(table) : [])

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-xxs font-semibold uppercase tracking-wide text-muted">
            {t('matrix_permissions')}
          </span>
          {!readOnly && model.rows.length > 8 && (
            <input
              className="input-sm w-40"
              placeholder={`${t('matrix_table')}…`}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          )}
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center gap-3 border-b bg-surface2 px-3 py-2">
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium text-ink">{t('matrix_wildcard')}</div>
              <div className="text-xxs text-muted">{t('matrix_wildcard_hint')}</div>
            </div>
            <Segmented
              value={model.wildcard}
              readOnly={readOnly}
              onChange={(wildcard) => onChange?.({ ...model, wildcard })}
            />
            <span className="w-6" />
          </div>
          <div className="divide-y">
            {visible.map(({ row, idx }) => (
              <TableRow
                key={row.table}
                row={row}
                columns={cols(row.table)}
                readOnly={readOnly}
                onChange={(patch) => patchRow(idx, patch)}
              />
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="mb-2 text-xxs font-semibold uppercase tracking-wide text-muted">
          {t('matrix_actions')}
        </div>
        {actions.length === 0 ? (
          <p className="text-[13px] text-muted">{t('matrix_actions_none')}</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {actions.map((a) => {
              const on = model.actions.includes(a)
              if (readOnly && !on) return null
              return (
                <button
                  key={a}
                  type="button"
                  disabled={readOnly}
                  onClick={() => toggleAction(a)}
                  className={clsx(
                    'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xxs font-medium transition-colors',
                    on ? 'border-transparent accent-soft' : 'text-muted hover:text-sec',
                    readOnly && 'cursor-default',
                  )}
                  title={a}
                >
                  <span className="text-muted">{actionTable(a)}</span>
                  <span>·</span>
                  <span>{a.slice(actionTable(a).length + 1) || a}</span>
                </button>
              )
            })}
            {readOnly && model.actions.length === 0 && (
              <span className="text-[13px] text-muted">{t('matrix_no_extra')}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
