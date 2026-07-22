import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import type { AuditChange } from '../api/types'
import { fmtDateTime, fmtInt } from '../lib/format'
import { useT } from '../lib/i18n'
import { useMeta } from '../lib/meta'
import { Badge } from '../components/CellValue'

const ACTION_COLORS: Record<string, string> = {
  create: 'green',
  update: 'blue',
  delete: 'red',
  login: 'gray',
}

function actionColor(action: string): Record<string, string> {
  const c = action.startsWith('action:') ? 'orange' : (ACTION_COLORS[action] ?? 'gray')
  return { [action]: c }
}

function fmtVal(v: unknown): string {
  if (v === null || v === undefined) return '∅'
  if (typeof v === 'object') return JSON.stringify(v)
  const s = String(v)
  return s.length > 24 ? `${s.slice(0, 24)}…` : s
}

function ChangePills({ changes }: { changes: Record<string, AuditChange> | null }) {
  if (!changes) return <span className="text-muted">—</span>
  return (
    <span className="flex flex-wrap gap-1.5">
      {Object.entries(changes).map(([k, c]) => (
        <span
          key={k}
          className="inline-flex items-center gap-1 rounded-full border px-2 py-px text-xxs"
        >
          <span className="text-muted">{k}:</span>
          <span className="text-serious line-through decoration-[color:var(--muted)]">
            {fmtVal(c.from)}
          </span>
          <span className="text-muted">→</span>
          <span className="font-medium text-ink">{fmtVal(c.to)}</span>
        </span>
      ))}
    </span>
  )
}

export default function Audit() {
  const meta = useMeta()
  const t = useT()
  const [sp, setSp] = useSearchParams()
  const table = sp.get('table') ?? ''
  const page = Math.max(1, Number(sp.get('page') ?? 1))
  const pp = 50

  const qs = new URLSearchParams()
  if (table) qs.set('table', table)
  qs.set('page', String(page))
  qs.set('pp', String(pp))

  const { data, isLoading } = useQuery({
    queryKey: ['audit', qs.toString()],
    queryFn: () => api.audit(qs.toString()),
  })

  const from = data ? (data.total === 0 ? 0 : (page - 1) * pp + 1) : 0
  const to = data ? Math.min(page * pp, data.total) : 0

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <select
          className="input-sm"
          value={table}
          onChange={(e) =>
            setSp(
              (p) => {
                const n = new URLSearchParams(p)
                if (e.target.value) n.set('table', e.target.value)
                else n.delete('table')
                n.delete('page')
                return n
              },
              { replace: true },
            )
          }
          aria-label={t('audit_table')}
        >
          <option value="">{t('audit_all_tables')}</option>
          {meta.tables.map((tb) => (
            <option key={tb.name} value={tb.name}>
              {tb.label_plural}
            </option>
          ))}
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-xxs font-semibold uppercase tracking-wide text-muted">
              <th className="whitespace-nowrap px-2.5 py-2">{t('audit_date')}</th>
              <th className="whitespace-nowrap px-2.5 py-2">{t('audit_actor')}</th>
              <th className="whitespace-nowrap px-2.5 py-2">{t('audit_action')}</th>
              <th className="whitespace-nowrap px-2.5 py-2">{t('audit_table')}</th>
              <th className="whitespace-nowrap px-2.5 py-2">{t('audit_pk')}</th>
              <th className="px-2.5 py-2">{t('audit_changes')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-muted">
                  {t('loading')}
                </td>
              </tr>
            )}
            {data?.rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-muted">
                  {t('audit_empty')}
                </td>
              </tr>
            )}
            {data?.rows.map((r) => (
              <tr key={r.id} className="border-t align-top hover:bg-hover">
                <td className="whitespace-nowrap px-2.5 py-2 tabular-nums text-sec">
                  {fmtDateTime(r.ts)}
                </td>
                <td className="whitespace-nowrap px-2.5 py-2">{r.actor}</td>
                <td className="whitespace-nowrap px-2.5 py-2">
                  <Badge value={r.action} colors={actionColor(r.action)} />
                </td>
                <td className="whitespace-nowrap px-2.5 py-2 text-sec">{r.table_name || '—'}</td>
                <td className="whitespace-nowrap px-2.5 py-2 font-mono text-[12px] text-muted">
                  {r.pk || '—'}
                </td>
                <td className="px-2.5 py-2">
                  <ChangePills changes={r.changes} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3 text-[13px] text-muted">
        <span className="tabular-nums">
          {data
            ? t('range_of', { from: fmtInt(from), to: fmtInt(to), total: fmtInt(data.total) })
            : '…'}
        </span>
        <div className="flex-1" />
        <button
          className="btn"
          disabled={page <= 1}
          onClick={() =>
            setSp((p) => {
              const n = new URLSearchParams(p)
              n.set('page', String(page - 1))
              return n
            })
          }
        >
          {t('prev')}
        </button>
        <button
          className="btn"
          disabled={!data || to >= data.total}
          onClick={() =>
            setSp((p) => {
              const n = new URLSearchParams(p)
              n.set('page', String(page + 1))
              return n
            })
          }
        >
          {t('next')}
        </button>
      </div>
    </div>
  )
}
