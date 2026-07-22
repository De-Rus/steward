import { useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import { imageUrl, uploadImage } from '../api/client'
import type { ColumnMeta, Row } from '../api/types'
import { fmtInt } from '../lib/format'
import { useT } from '../lib/i18n'
import { useToast } from './Toast'

export function imageLabel(row: Row, pk: string): string {
  for (const k of ['symbol', 'name', 'title', 'email']) {
    const v = row[k]
    if (typeof v === 'string' && v) return v
  }
  return pk
}

function initialBust(row: Row): string {
  const u = row.updated_at
  return typeof u === 'string' && u ? u : String(Date.now())
}

function Placeholder({ col, size, label }: { col: ColumnMeta; size: 'sm' | 'lg'; label: string }) {
  return (
    <span
      className={clsx(
        'flex h-full w-full select-none items-center justify-center bg-page font-medium uppercase text-muted',
        size === 'sm' ? 'text-[11px]' : 'text-lg',
      )}
      aria-label={label}
    >
      {col.name.charAt(0) || '▢'}
    </span>
  )
}

export function ImageThumb({
  table,
  col,
  pk,
  row,
}: {
  table: string
  col: ColumnMeta
  pk: string
  row: Row
}) {
  const t = useT()
  const [broken, setBroken] = useState(false)
  const bust = useMemo(() => initialBust(row), [row])
  const src = imageUrl(table, col.name, pk, bust, imageLabel(row, pk))
  useEffect(() => setBroken(false), [src])
  return (
    <span className="checker inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md ring-1 ring-[var(--border)]">
      {broken ? (
        <Placeholder col={col} size="sm" label={t('image_none')} />
      ) : (
        <img
          src={src}
          alt=""
          loading="lazy"
          className="h-full w-full object-contain"
          onError={() => setBroken(true)}
        />
      )}
    </span>
  )
}

export function ImageField({
  table,
  col,
  pk,
  row,
  canUpload,
}: {
  table: string
  col: ColumnMeta
  pk: string
  row: Row
  canUpload: boolean
}) {
  const t = useT()
  const toast = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [bust, setBust] = useState(() => initialBust(row))
  const [broken, setBroken] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState<string | null>(() =>
    typeof row[col.name] === 'string' && row[col.name] ? String(row[col.name]) : null,
  )
  const params = col.params as { uploadable?: boolean; max_px?: number }
  const src = imageUrl(table, col.name, pk, bust, imageLabel(row, pk))

  const upload = async (file: File | undefined) => {
    if (!file || busy) return
    if (!file.type.startsWith('image/')) {
      setError(t('image_not_image'))
      return
    }
    setBusy(true)
    setError(null)
    try {
      await uploadImage(table, col.name, pk, file)
      setFileName(file.name)
      setBust(String(Date.now()))
      setBroken(false)
      toast(t('image_updated'))
    } catch (e) {
      setError(e instanceof Error ? e.message : t('image_upload_error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-start gap-4">
      <div
        className={clsx(
          'checker relative h-32 w-32 shrink-0 overflow-hidden rounded-card border',
          dragOver && 'border-accent ring-2 ring-[var(--accent)]',
          canUpload && 'cursor-pointer',
        )}
        onClick={() => canUpload && inputRef.current?.click()}
        onDragOver={(e) => {
          if (!canUpload) return
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          if (!canUpload) return
          e.preventDefault()
          setDragOver(false)
          void upload(e.dataTransfer.files[0])
        }}
        role={canUpload ? 'button' : undefined}
        aria-label={canUpload ? t('image_replace') : undefined}
      >
        {broken ? (
          <Placeholder col={col} size="lg" label={t('image_none')} />
        ) : (
          <img
            src={src}
            alt={fileName ?? col.name}
            className="h-full w-full object-contain"
            onError={() => setBroken(true)}
          />
        )}
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          </div>
        )}
      </div>
      <div className="min-w-0 space-y-1.5 pt-1">
        {fileName && <div className="truncate text-[13px] text-muted">{fileName}</div>}
        {canUpload && (
          <>
            <button
              type="button"
              className="btn"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              {busy ? t('image_uploading') : t('image_replace')}
            </button>
            <p className="text-xxs text-muted">
              {t('image_drop_hint')}
              {params.max_px ? ` · ${t('image_max_px', { px: fmtInt(params.max_px) })}` : ''}
            </p>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                void upload(e.target.files?.[0])
                e.target.value = ''
              }}
            />
          </>
        )}
        {error && <p className="text-xxs text-critical">{error}</p>}
      </div>
    </div>
  )
}
