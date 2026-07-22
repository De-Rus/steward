import { useMemo, useState } from 'react'
import { api } from '../api/client'
import type { ColumnMeta, Row, TableMeta } from '../api/types'
import { isEditable } from '../lib/perms'
import { useT } from '../lib/i18n'
import { FieldInput } from './FieldInput'
import { Modal } from './Modal'

export function BulkEditModal({
  table,
  pks,
  onClose,
  onDone,
}: {
  table: TableMeta
  pks: string[]
  onClose: () => void
  onDone: (affected: number) => void
}) {
  const t = useT()
  const editable = useMemo(
    () => table.columns.filter((c) => isEditable(table, c)),
    [table],
  )
  const [colName, setColName] = useState(editable[0]?.name ?? '')
  const col = editable.find((c) => c.name === colName) as ColumnMeta | undefined
  const [value, setValue] = useState<unknown>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (!col) return
    setRunning(true)
    setError(null)
    try {
      const res = await api.bulk(table.name, pks, { [col.name]: value } as Row)
      onDone(res.affected)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('error'))
      setRunning(false)
    }
  }

  return (
    <Modal title={`${t('edit')} · ${pks.length}`} onClose={onClose}>
      {editable.length === 0 ? (
        <p className="text-sm text-sec">{t('no_editable_cols')}</p>
      ) : (
        <div className="space-y-3">
          <div>
            <div className="mb-1 text-xxs uppercase tracking-wide text-muted">{t('column')}</div>
            <select
              className="input w-full"
              value={colName}
              onChange={(e) => {
                setColName(e.target.value)
                setValue(null)
                setError(null)
              }}
            >
              {editable.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          {col && (
            <div>
              <div className="mb-1 text-xxs uppercase tracking-wide text-muted">{t('value')}</div>
              <FieldInput
                col={col}
                tableName={table.name}
                value={value}
                row={{}}
                onChange={(v) => setValue(v)}
              />
            </div>
          )}
          {error && <p className="text-xxs text-critical">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn" onClick={onClose} disabled={running}>
              {t('cancel')}
            </button>
            <button type="button" className="btn btn-primary" onClick={submit} disabled={running || !col}>
              {running ? t('saving') : t('apply_to', { count: pks.length })}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
