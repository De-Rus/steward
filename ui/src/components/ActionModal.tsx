import { useState } from 'react'
import type { ActionMeta } from '../api/types'
import { interpolate } from '../lib/format'
import { useT } from '../lib/i18n'
import { IconWarn } from './Icons'
import { Modal } from './Modal'

export function ActionModal({
  action,
  count,
  onClose,
  onConfirm,
}: {
  action: ActionMeta
  count: number
  onClose: () => void
  onConfirm: () => Promise<void>
}) {
  const t = useT()
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const enabled = !busy && (!action.danger || typed === action.name)

  const run = async () => {
    setBusy(true)
    setError(null)
    try {
      await onConfirm()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setBusy(false)
    }
  }

  return (
    <Modal title={action.label} onClose={onClose}>
      <p className="text-sm text-sec">{interpolate(action.confirm, { count })}</p>
      {action.danger && (
        <div className="mt-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-xxs font-medium uppercase tracking-wide text-serious">
            <IconWarn size={13} /> {t('danger_action')}
          </div>
          <label className="mb-1 block text-[13px] text-muted">
            {t('type_to_confirm', { name: action.name })}
          </label>
          <input
            className="input w-full font-mono"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoFocus
          />
        </div>
      )}
      {error && <p className="mt-3 text-[13px] text-critical">{error}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <button className="btn" onClick={onClose} disabled={busy}>
          {t('cancel')}
        </button>
        <button
          className={action.danger ? 'btn btn-danger' : 'btn btn-primary'}
          onClick={run}
          disabled={!enabled}
        >
          {busy ? t('running') : action.label}
        </button>
      </div>
    </Modal>
  )
}
