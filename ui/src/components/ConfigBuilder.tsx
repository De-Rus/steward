import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { api, ApiError } from '../api/client'
import type { ConfigPut, ConfigPutBody, Row, TableMeta } from '../api/types'
import {
  type TableConfigData,
  interpretPut,
  modelChanged,
  modelFromApi,
  modelFromMeta,
  modelToApi,
} from '../lib/configModel'
import { useT, type TFn } from '../lib/i18n'
import { useToast } from './Toast'
import { IconCopy, IconDownload, IconX } from './Icons'
import { ListEditor } from './config/ListEditor'
import { FieldsEditor } from './config/FieldsEditor'
import { DisplayEditor } from './config/DisplayEditor'
import { DetailEditor } from './config/DetailEditor'
import { PermissionsEditor } from './config/PermissionsEditor'
import { ActionsEditor } from './config/ActionsEditor'
import { RawEditor } from './config/RawEditor'
import { HistoryEditor } from './config/HistoryEditor'

type Tab = 'list' | 'fields' | 'display' | 'detail' | 'permissions' | 'actions' | 'hcl' | 'history'

const TABS: { id: Tab; key: string }[] = [
  { id: 'list', key: 'cfg_tab_list' },
  { id: 'fields', key: 'cfg_tab_fields' },
  { id: 'display', key: 'cfg_tab_display' },
  { id: 'detail', key: 'cfg_tab_detail' },
  { id: 'permissions', key: 'cfg_tab_permissions' },
  { id: 'actions', key: 'cfg_tab_actions' },
  { id: 'hcl', key: 'cfg_tab_hcl' },
  { id: 'history', key: 'cfg_tab_history' },
]

function download(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function ReadOnlyPanel({ table, hcl, t }: { table: string; hcl: string; t: TFn }) {
  const [copied, setCopied] = useState(false)
  const file = `${table}.hcl`
  return (
    <div className="space-y-3">
      <div className="rounded-card border border-dashed bg-surface2 p-3">
        <div className="text-[13px] font-semibold text-ink">{t('cfg_readonly_title')}</div>
        <div className="mt-1 text-xxs text-muted">{t('cfg_readonly_hint', { file })}</div>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            className="btn"
            onClick={() => {
              void navigator.clipboard?.writeText(hcl)
              setCopied(true)
              setTimeout(() => setCopied(false), 1500)
            }}
          >
            <IconCopy size={13} /> {copied ? t('cfg_copied') : t('cfg_copy')}
          </button>
          <button type="button" className="btn" onClick={() => download(file, hcl)}>
            <IconDownload size={13} /> {t('cfg_download')}
          </button>
        </div>
      </div>
      <pre className="max-h-[50vh] overflow-auto rounded-card border bg-page p-3 font-mono text-[12px] leading-relaxed text-sec">
        {hcl}
      </pre>
    </div>
  )
}

function BuilderBody({
  table,
  initialModel,
  initialHcl,
  sampleRows,
  tab,
  onTab,
}: {
  table: TableMeta
  initialModel: TableConfigData
  initialHcl: string
  sampleRows: Row[]
  tab: Tab
  onTab: (next: Tab) => void
}) {
  const t = useT()
  const toast = useToast()
  const qc = useQueryClient()

  const [model, setModel] = useState<TableConfigData>(initialModel)
  const [raw, setRaw] = useState(initialHcl)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [readOnlyHcl, setReadOnlyHcl] = useState<string | null>(null)
  const [confirmDiscard, setConfirmDiscard] = useState(false)

  const modelDirty = modelChanged(model, initialModel)
  const rawDirty = raw !== initialHcl
  const activeIsRaw = tab === 'hcl'
  const isVisual = tab !== 'hcl' && tab !== 'history'
  const staleModel = activeIsRaw && modelDirty
  const staleRaw = isVisual && rawDirty
  const staleWarn = staleModel ? t('cfg_stale_model_warn') : staleRaw ? t('cfg_stale_raw_warn') : null

  const switchTab = (next: Tab) => {
    if (next === tab) return
    setSaveError(null)
    setReadOnlyHcl(null)
    setConfirmDiscard(false)
    onTab(next)
  }

  const currentPayload = (): ConfigPutBody =>
    tab === 'hcl' ? { hcl: raw } : { model: modelToApi(model) as Record<string, unknown> }

  const invalidateLive = () => {
    void qc.invalidateQueries({ queryKey: ['meta'] })
    void qc.invalidateQueries({ queryKey: ['list', table.name] })
    void qc.invalidateQueries({ queryKey: ['row', table.name] })
    void qc.invalidateQueries({ queryKey: ['config', table.name] })
  }

  const save = useMutation({
    mutationFn: (payload: ConfigPutBody) => api.putConfig(table.name, payload),
    onSuccess: (res: ConfigPut) => {
      const outcome = interpretPut(res)
      if (outcome.kind === 'applied') {
        toast(t('cfg_saved'))
        setReadOnlyHcl(null)
        invalidateLive()
      } else {
        setReadOnlyHcl(outcome.hcl)
      }
    },
    onError: (e) => {
      setSaveError(e instanceof ApiError ? e.message : t('error'))
    },
  })

  const onSave = () => {
    if (staleWarn && !confirmDiscard) {
      setConfirmDiscard(true)
      return
    }
    setSaveError(null)
    setReadOnlyHcl(null)
    setConfirmDiscard(false)
    save.mutate(currentPayload())
  }

  const update = (m: TableConfigData) => {
    setModel(m)
    setReadOnlyHcl(null)
    setConfirmDiscard(false)
  }

  const updateRaw = (v: string) => {
    setRaw(v)
    setConfirmDiscard(false)
  }

  const onPublished = () => {
    setSaveError(null)
    setReadOnlyHcl(null)
    toast(t('cfg_hist_published_toast'))
    invalidateLive()
  }

  return (
    <>
      <div className="flex shrink-0 gap-1 overflow-x-auto border-b px-3">
        {TABS.map((tb) => (
          <button
            key={tb.id}
            type="button"
            onClick={() => switchTab(tb.id)}
            className={clsx(
              'shrink-0 border-b-2 px-3 py-2 text-[13px] font-medium transition-colors',
              tab === tb.id
                ? 'border-accent text-ink'
                : 'border-transparent text-muted hover:text-sec',
            )}
          >
            {t(tb.key)}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        {readOnlyHcl !== null ? (
          <ReadOnlyPanel table={table.name} hcl={readOnlyHcl} t={t} />
        ) : (
          <>
            {tab === 'list' && <ListEditor meta={table} model={model} onChange={update} />}
            {tab === 'fields' && (
              <FieldsEditor meta={table} model={model} sampleRows={sampleRows} onChange={update} />
            )}
            {tab === 'display' && <DisplayEditor meta={table} model={model} onChange={update} />}
            {tab === 'detail' && <DetailEditor meta={table} model={model} onChange={update} />}
            {tab === 'permissions' && <PermissionsEditor model={model} onChange={update} />}
            {tab === 'actions' && <ActionsEditor meta={table} model={model} onChange={update} />}
            {tab === 'hcl' && <RawEditor value={raw} onChange={updateRaw} />}
            {tab === 'history' && (
              <HistoryEditor
                table={table.name}
                onPublished={onPublished}
                onReadOnly={setReadOnlyHcl}
              />
            )}
          </>
        )}
      </div>

      <div className="flex shrink-0 flex-col gap-2 border-t px-4 py-3">
        {staleWarn && (
          <div
            role="alert"
            className="rounded-ctl border border-warning/40 bg-warning/10 px-3 py-2 text-xxs text-warning"
          >
            {staleWarn}
          </div>
        )}
        <div className="flex items-center gap-3">
          {saveError ? (
            <span className="min-w-0 flex-1 truncate text-xxs text-critical">{saveError}</span>
          ) : isVisual ? (
            <span className="min-w-0 flex-1 truncate text-xxs text-muted">{t('cfg_visual_regen_hint')}</span>
          ) : (
            <div className="flex-1" />
          )}
          {tab === 'history' ? (
            <span className="text-xxs text-muted">{t('cfg_hist_footer_hint')}</span>
          ) : (
            <button type="button" className="btn btn-primary" onClick={onSave} disabled={save.isPending}>
              {save.isPending ? t('saving') : confirmDiscard ? t('cfg_save_anyway') : t('save')}
            </button>
          )}
        </div>
      </div>
    </>
  )
}

export function ConfigBuilder({
  table,
  sampleRows = [],
  onClose,
}: {
  table: TableMeta
  sampleRows?: Row[]
  onClose: () => void
}) {
  const t = useT()
  const [tab, setTab] = useState<Tab>('list')
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['config', table.name],
    queryFn: () => api.getConfig(table.name),
  })

  const model = data
    ? (() => {
        const m = modelFromApi(data.model)
        return Object.keys(m).length ? m : modelFromMeta(table)
      })()
    : null

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="sheet-in flex h-full w-full flex-col bg-surface1 shadow-modal"
        style={{ maxWidth: 820 }}
        role="dialog"
        aria-modal
        aria-label={t('cfg_title', { label: table.label_plural })}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b px-4 py-3">
          <div>
            <h2 className="text-[15px] font-semibold text-ink">
              {t('cfg_title', { label: table.label_plural })}
            </h2>
            <p className="text-xxs text-muted">{t('cfg_subtitle')}</p>
          </div>
          <button
            type="button"
            className="rounded-ctl p-1 text-muted hover:text-ink"
            onClick={onClose}
            aria-label={t('cfg_close')}
          >
            <IconX size={16} />
          </button>
        </div>

        {isLoading && <div className="p-8 text-center text-[13px] text-muted">{t('cfg_loading')}</div>}
        {isError && <div className="p-8 text-center text-[13px] text-critical">{t('cfg_load_failed')}</div>}
        {data && model && (
          <BuilderBody
            key={`${table.name}:${data.hcl}`}
            table={table}
            initialModel={model}
            initialHcl={data.hcl}
            sampleRows={sampleRows}
            tab={tab}
            onTab={setTab}
          />
        )}
      </div>
    </div>
  )
}
