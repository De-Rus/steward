import clsx from 'clsx'
import type { ActionMeta, Row, TableMeta } from '../api/types'
import { fmtDateTime } from '../lib/format'
import { useT } from '../lib/i18n'
import { AuditTimeline } from './AuditTimeline'
import { IconTrash } from './Icons'

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b py-1.5 last:border-0">
      <span className="text-xxs uppercase tracking-wide text-muted">{label}</span>
      <span className="min-w-0 truncate text-right text-[13px] text-sec">{children}</span>
    </div>
  )
}

export function MetaRail({
  table,
  pk,
  row,
  actions,
  onAction,
  onDelete,
}: {
  table: TableMeta
  pk: string
  row: Row
  actions: ActionMeta[]
  onAction: (a: ActionMeta) => void
  onDelete?: () => void
}) {
  const t = useT()
  const dateCols = table.columns.filter(
    (c) => (c.widget === 'datetime' || c.widget === 'relative_time') && row[c.name] != null,
  )

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <h3 className="mb-1 text-[13px] font-semibold text-ink">{t('metadata')}</h3>
        <Fact label={table.pk}>
          <span className="font-mono text-[12px]">{pk}</span>
        </Fact>
        {dateCols.map((c) => (
          <Fact key={c.name} label={c.name}>
            <span className="tabular-nums" title={fmtDateTime(String(row[c.name]))}>
              {fmtDateTime(String(row[c.name]))}
            </span>
          </Fact>
        ))}
      </div>

      {(actions.length > 0 || onDelete) && (
        <div className="card p-2">
          {actions.map((a) => (
            <button
              key={a.name}
              type="button"
              onClick={() => onAction(a)}
              className={clsx(
                'block w-full rounded-ctl px-3 py-1.5 text-left text-[13px] hover:bg-hover',
                a.danger ? 'text-critical' : 'text-sec hover:text-ink',
              )}
            >
              {a.label}
            </button>
          ))}
          {onDelete && (
            <>
              {actions.length > 0 && <div className="my-1 border-t" />}
              <button
                type="button"
                onClick={onDelete}
                className="flex w-full items-center gap-1.5 rounded-ctl px-3 py-1.5 text-left text-[13px] text-critical hover:bg-hover"
              >
                <IconTrash size={13} /> {t('delete')}
              </button>
            </>
          )}
        </div>
      )}

      <div className="card p-4">
        <h3 className="mb-2 text-[13px] font-semibold text-ink">{t('history')}</h3>
        <AuditTimeline table={table.name} pk={pk} />
      </div>
    </div>
  )
}
