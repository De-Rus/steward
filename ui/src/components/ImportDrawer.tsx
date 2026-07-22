import { useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import { api } from '../api/client'
import type { ImportResult, TableMeta } from '../api/types'
import {
  detectFormat,
  type ImportFormat,
  type ImportMode,
  previewImport,
  summarizeImport,
} from '../lib/importer'
import { Sheet } from './Sheet'

export function ImportDrawer({
  table,
  onClose,
  onDone,
}: {
  table: TableMeta
  onClose: () => void
  onDone: () => void
}) {
  const [raw, setRaw] = useState('')
  const [format, setFormat] = useState<ImportFormat>('csv')
  const [mode, setMode] = useState<ImportMode>('insert')
  const [dragging, setDragging] = useState(false)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const preview = useMemo(() => previewImport(format, raw), [format, raw])

  const loadFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? '')
      setFormat(detectFormat(file.name, text))
      setRaw(text)
      setResult(null)
      setError(null)
    }
    reader.readAsText(file)
  }

  const submit = async () => {
    setRunning(true)
    setError(null)
    try {
      const res = await api.import(table.name, format, raw, mode)
      setResult(res)
      if (res.inserted || res.updated) onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import falló')
    } finally {
      setRunning(false)
    }
  }

  const previewCols = preview.columns.slice(0, 6)
  const previewRows = preview.rows.slice(0, 5)

  return (
    <Sheet title={`Import · ${table.label_plural}`} onClose={onClose}>
      <div className="space-y-4">
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            const f = e.dataTransfer.files[0]
            if (f) loadFile(f)
          }}
          className={clsx(
            'flex flex-col items-center justify-center rounded-card border border-dashed p-6 text-center text-[13px]',
            dragging ? 'border-accent bg-selected' : 'text-muted',
          )}
        >
          <p>Arrastra un archivo CSV o JSON, o</p>
          <button type="button" className="btn mt-2" onClick={() => fileRef.current?.click()}>
            Elegir archivo
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.json,text/csv,application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) loadFile(f)
            }}
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex overflow-hidden rounded-ctl border text-xxs">
            {(['csv', 'json'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                className={clsx('px-2.5 py-1 uppercase', format === f ? 'bg-surface3 text-ink' : 'text-muted hover:text-ink')}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex overflow-hidden rounded-ctl border text-xxs">
            {(['insert', 'upsert'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={clsx('px-2.5 py-1 capitalize', mode === m ? 'bg-surface3 text-ink' : 'text-muted hover:text-ink')}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <textarea
          className="input w-full font-mono text-xs leading-5"
          rows={7}
          placeholder={format === 'csv' ? 'col_a,col_b\nval,val' : '[{"col_a": "val"}]'}
          value={raw}
          onChange={(e) => {
            setRaw(e.target.value)
            setResult(null)
            setError(null)
          }}
          spellCheck={false}
        />

        {preview.error && <p className="text-xxs text-critical">{preview.error}</p>}

        {previewRows.length > 0 && (
          <div>
            <div className="mb-1 text-xxs uppercase tracking-wide text-muted">
              Vista previa · {preview.count} filas
            </div>
            <div className="overflow-x-auto rounded-card border">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-left text-xxs uppercase tracking-wide text-muted">
                    {previewCols.map((c) => (
                      <th key={c} className="whitespace-nowrap px-2 py-1.5">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((r, i) => (
                    <tr key={i} className="border-t">
                      {previewCols.map((c) => (
                        <td key={c} className="max-w-[16ch] truncate px-2 py-1 text-sec">
                          {r[c] == null ? '—' : String(r[c])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {error && <p className="text-[13px] text-critical">{error}</p>}

        {result && (
          <div className="rounded-card border p-3 text-[13px]">
            <div className="font-medium text-ink">{summarizeImport(result)}</div>
            <div className="mt-1 flex gap-4 tabular-nums text-muted">
              <span>{result.inserted} nuevas</span>
              <span>{result.updated} actualizadas</span>
              <span>{result.skipped} omitidas</span>
            </div>
            {result.errors.length > 0 && (
              <div className="mt-2 max-h-40 overflow-auto border-t pt-2">
                {result.errors.map((e, i) => (
                  <div key={i} className="text-xxs text-critical">
                    fila {e.row}: {e.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="btn" onClick={onClose}>
            Cerrar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={running || preview.count === 0 || !!preview.error}
            onClick={submit}
          >
            {running ? 'Importando…' : `Importar ${preview.count || ''}`.trim()}
          </button>
        </div>
      </div>
    </Sheet>
  )
}
