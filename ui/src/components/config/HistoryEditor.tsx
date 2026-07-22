import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { api, ApiError } from '../../api/client'
import type { ConfigPublishResult } from '../../api/types'
import { useT } from '../../lib/i18n'
import { relTime } from '../../lib/format'
import { lineDiff, diffStat, type DiffLine } from '../../lib/diff'
import { Modal } from '../Modal'
import { IconCheck } from '../Icons'

function fmtBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

const rowBg = (op: DiffLine['op']): string | undefined => {
  if (op === 'add') return 'color-mix(in srgb, var(--good) 15%, transparent)'
  if (op === 'del') return 'color-mix(in srgb, var(--critical) 15%, transparent)'
  return undefined
}

const sign = (op: DiffLine['op']): string => (op === 'add' ? '+' : op === 'del' ? '−' : ' ')

function DiffPre({ lines }: { lines: DiffLine[] }) {
  return (
    <pre className="max-h-[46vh] overflow-auto rounded-card border bg-page font-mono text-[12px] leading-relaxed">
      {lines.map((l, i) => (
        <div
          key={i}
          className={clsx(
            'flex gap-2 px-2',
            l.op === 'add' ? 'text-good' : l.op === 'del' ? 'text-critical' : 'text-sec',
          )}
          style={{ background: rowBg(l.op) }}
        >
          <span className="select-none opacity-60">{sign(l.op)}</span>
          <span className="whitespace-pre-wrap break-all">{l.text}</span>
        </div>
      ))}
    </pre>
  )
}

export function HistoryEditor({
  table,
  onPublished,
  onReadOnly,
}: {
  table: string
  onPublished: () => void
  onReadOnly: (hcl: string) => void
}) {
  const t = useT()
  const qc = useQueryClient()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [mode, setMode] = useState<'diff' | 'toml'>('diff')
  const [confirming, setConfirming] = useState(false)
  const [pubError, setPubError] = useState<string | null>(null)

  const versionsQ = useQuery({
    queryKey: ['configVersions', table],
    queryFn: () => api.configVersions(table),
  })
  const versions = useMemo(() => versionsQ.data?.versions ?? [], [versionsQ.data])

  useEffect(() => {
    if (versions.length && !versions.some((v) => v.id === selectedId)) {
      setSelectedId(versions[0].id)
    }
  }, [versions, selectedId])

  const selected = versions.find((v) => v.id === selectedId) ?? null

  const selectedBodyQ = useQuery({
    queryKey: ['configVersion', table, selectedId],
    queryFn: () => api.configVersion(table, selectedId as number),
    enabled: selectedId != null,
  })
  // Diff each version against the one immediately before it (what changed in this
  // version), not against the published one — otherwise the current/published
  // version diffs against itself and shows nothing.
  const baseVersion = useMemo(() => {
    const i = versions.findIndex((v) => v.id === selectedId)
    return i >= 0 ? (versions[i + 1] ?? null) : null
  }, [versions, selectedId])
  const baseBodyQ = useQuery({
    queryKey: ['configVersion', table, baseVersion?.id],
    queryFn: () => api.configVersion(table, baseVersion?.id as number),
    enabled: baseVersion != null,
  })

  const selectedHcl = selectedBodyQ.data?.hcl ?? ''
  const baseHcl = baseBodyQ.data?.hcl ?? ''
  const diff = useMemo(() => lineDiff(baseHcl, selectedHcl), [baseHcl, selectedHcl])
  const stat = diffStat(diff)
  const bodyLoading = selectedBodyQ.isLoading || (baseVersion != null && baseBodyQ.isLoading)

  const publish = useMutation({
    mutationFn: (id: number) => api.publishConfigVersion(table, id),
    onSuccess: (res: ConfigPublishResult) => {
      setConfirming(false)
      if (res.ok) {
        onPublished()
        void qc.invalidateQueries({ queryKey: ['configVersions', table] })
      } else {
        onReadOnly(res.hcl)
      }
    },
    onError: (e) => {
      setConfirming(false)
      setPubError(e instanceof ApiError ? e.message : t('error'))
    },
  })

  if (versionsQ.isLoading) {
    return <div className="text-[13px] text-muted">{t('cfg_hist_loading')}</div>
  }
  if (versionsQ.isError) {
    return <div className="text-[13px] text-critical">{t('cfg_hist_load_failed')}</div>
  }
  if (!versions.length) {
    return <div className="text-[13px] text-muted">{t('cfg_hist_empty')}</div>
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <ul className="shrink-0 space-y-1 sm:w-56">
        {versions.map((v) => (
          <li key={v.id}>
            <button
              type="button"
              onClick={() => {
                setSelectedId(v.id)
                setPubError(null)
              }}
              className={clsx(
                'w-full rounded-ctl border px-2.5 py-2 text-left transition-colors',
                v.id === selectedId
                  ? 'border-accent bg-surface2'
                  : 'border-transparent hover:bg-hover',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-medium text-ink">{relTime(v.created_at)}</span>
                {v.published && (
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-good"
                    style={{ background: 'color-mix(in srgb, var(--good) 15%, transparent)' }}
                  >
                    {t('cfg_hist_published')}
                  </span>
                )}
              </div>
              <div className="mt-0.5 truncate text-xxs text-muted">{v.actor}</div>
              <div className="mt-0.5 flex items-center gap-2 text-xxs text-muted">
                <span>{fmtBytes(v.bytes)}</span>
                {v.note && <span className="truncate">· {v.note}</span>}
              </div>
            </button>
          </li>
        ))}
      </ul>

      <div className="min-w-0 flex-1 space-y-2">
        {selected && (
          <>
            <div className="flex items-center gap-2">
              <div className="flex rounded-ctl border p-0.5">
                {(['diff', 'toml'] as const).map((mo) => (
                  <button
                    key={mo}
                    type="button"
                    onClick={() => setMode(mo)}
                    className={clsx(
                      'rounded-[5px] px-2.5 py-1 text-xxs font-medium transition-colors',
                      mode === mo ? 'bg-surface2 text-ink' : 'text-muted hover:text-sec',
                    )}
                  >
                    {mo === 'diff' ? t('cfg_hist_view_diff') : t('cfg_hist_view_hcl')}
                  </button>
                ))}
              </div>
              {mode === 'diff' &&
                !selected.published &&
                (stat.added > 0 || stat.removed > 0) && (
                  <span className="text-xxs font-medium">
                    <span className="text-good">+{stat.added}</span>{' '}
                    <span className="text-critical">−{stat.removed}</span>
                  </span>
                )}
              <div className="flex-1" />
              {selected.published ? (
                <span className="inline-flex items-center gap-1 text-xxs text-muted">
                  <IconCheck size={12} className="text-good" /> {t('cfg_hist_is_published')}
                </span>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setPubError(null)
                    setConfirming(true)
                  }}
                >
                  {t('cfg_hist_publish')}
                </button>
              )}
            </div>

            {pubError && (
              <div className="rounded-ctl border bg-surface2 px-2.5 py-1.5 text-xxs text-critical">
                {pubError}
              </div>
            )}

            {bodyLoading ? (
              <div className="text-[13px] text-muted">{t('cfg_hist_loading')}</div>
            ) : mode === 'diff' ? (
              <DiffPre lines={diff} />
            ) : (
              <pre className="max-h-[46vh] overflow-auto rounded-card border bg-page p-3 font-mono text-[12px] leading-relaxed text-sec">
                {selectedHcl}
              </pre>
            )}
          </>
        )}
      </div>

      {confirming && selected && (
        <Modal title={t('cfg_hist_publish_confirm_title')} onClose={() => setConfirming(false)}>
          <p className="text-[13px] text-sec">
            {t('cfg_hist_publish_confirm', {
              time: relTime(selected.created_at),
              actor: selected.actor,
            })}
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              className="btn"
              onClick={() => setConfirming(false)}
              disabled={publish.isPending}
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => publish.mutate(selected.id)}
              disabled={publish.isPending}
            >
              {publish.isPending ? t('cfg_hist_publishing') : t('cfg_hist_publish')}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
