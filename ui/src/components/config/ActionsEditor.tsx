import { useState } from 'react'
import type { ActionConfigData, ActionKindData, Json, TableConfigData } from '../../lib/configModel'
import { ACTION_KINDS } from '../../lib/configModel'
import type { ColumnMeta, TableMeta } from '../../api/types'
import { useT } from '../../lib/i18n'
import { IconPlus, IconX } from '../Icons'
import { KeyValueEditor, Labeled, Section, Toggle } from './parts'
import { EnumSelect, HTTP_METHODS } from './pickers'

function toStringMap(set: Record<string, Json> | undefined): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(set ?? {})) out[k] = typeof v === 'string' ? v : JSON.stringify(v)
  return out
}

function ActionCard({
  name,
  action,
  columns,
  onChange,
  onRename,
  onRemove,
}: {
  name: string
  action: ActionConfigData
  columns: ColumnMeta[]
  onChange: (a: ActionConfigData) => void
  onRename: (next: string) => void
  onRemove: () => void
}) {
  const t = useT()
  const kindLabel: Record<ActionKindData, string> = {
    update: t('cfg_action_kind_update'),
    delete: t('cfg_action_kind_delete'),
    webhook: t('cfg_action_kind_webhook'),
  }
  return (
    <div className="card space-y-3 p-3">
      <div className="flex items-center gap-2">
        <input
          className="input-sm flex-1 font-mono"
          value={name}
          placeholder={t('cfg_action_name')}
          onChange={(e) => onRename(e.target.value)}
        />
        <button type="button" className="p-1 text-muted hover:text-critical" onClick={onRemove} aria-label={t('cfg_remove')}>
          <IconX size={14} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Labeled label={t('cfg_action_label')}>
          <input
            className="input-sm w-full"
            value={action.label}
            onChange={(e) => onChange({ ...action, label: e.target.value })}
          />
        </Labeled>
        <Labeled label={t('cfg_action_kind')}>
          <select
            className="input-sm w-full"
            value={action.kind}
            onChange={(e) => onChange({ ...action, kind: e.target.value as ActionKindData })}
          >
            {ACTION_KINDS.map((k) => (
              <option key={k} value={k}>
                {kindLabel[k]}
              </option>
            ))}
          </select>
        </Labeled>
      </div>

      {action.kind === 'webhook' && (
        <div className="grid grid-cols-2 gap-2">
          <Labeled label={t('cfg_action_url')}>
            <input
              className="input-sm w-full font-mono"
              value={action.url ?? ''}
              onChange={(e) => onChange({ ...action, url: e.target.value || undefined })}
            />
          </Labeled>
          <Labeled label={t('cfg_action_method')}>
            <EnumSelect
              className="w-full"
              value={action.method}
              options={HTTP_METHODS}
              emptyLabel="POST"
              ariaLabel={t('cfg_action_method')}
              onChange={(v) => onChange({ ...action, method: v })}
            />
          </Labeled>
        </div>
      )}

      {action.kind === 'update' && (
        <Labeled label={t('cfg_action_set')}>
          <KeyValueEditor
            entries={toStringMap(action.set)}
            keyOptions={columns}
            keyPlaceholder={t('cfg_action_set_add')}
            valuePlaceholder="value"
            onChange={(set) =>
              onChange({ ...action, set: Object.keys(set).length ? (set as Record<string, Json>) : undefined })
            }
          />
        </Labeled>
      )}

      <Labeled label={t('cfg_action_confirm')}>
        <input
          className="input-sm w-full"
          value={action.confirm ?? ''}
          onChange={(e) => onChange({ ...action, confirm: e.target.value || undefined })}
        />
      </Labeled>

      <Toggle
        checked={!!action.danger}
        onChange={(v) => onChange({ ...action, danger: v || undefined })}
        label={t('cfg_action_danger')}
      />
    </div>
  )
}

export function ActionsEditor({
  meta,
  model,
  onChange,
}: {
  meta: TableMeta
  model: TableConfigData
  onChange: (m: TableConfigData) => void
}) {
  const t = useT()
  const [seq, setSeq] = useState(1)
  const actions = model.actions ?? {}
  const names = Object.keys(actions)

  const setActions = (next: Record<string, ActionConfigData>) => {
    onChange({ ...model, actions: Object.keys(next).length ? next : undefined })
  }
  const add = () => {
    let name = `action_${seq}`
    while (name in actions) name = `action_${seq + 1}`
    setSeq((s) => s + 1)
    setActions({ ...actions, [name]: { label: '', kind: 'update' } })
  }
  const update = (name: string, a: ActionConfigData) => setActions({ ...actions, [name]: a })
  const remove = (name: string) => {
    const next = { ...actions }
    delete next[name]
    setActions(next)
  }
  const rename = (from: string, to: string) => {
    if (to === from) return
    const next: Record<string, ActionConfigData> = {}
    for (const k of names) next[k === from ? to || from : k] = actions[k]
    setActions(next)
  }

  return (
    <Section
      title={t('cfg_tab_actions')}
      hint={t('cfg_actions_hint')}
      right={
        <button type="button" className="btn" onClick={add}>
          <IconPlus size={13} /> {t('cfg_actions_add')}
        </button>
      }
    >
      {names.length === 0 && <div className="text-xxs text-muted">{t('cfg_action_empty')}</div>}
      <div className="space-y-3">
        {names.map((name) => (
          <ActionCard
            key={name}
            name={name}
            action={actions[name]}
            columns={meta.columns}
            onChange={(a) => update(name, a)}
            onRename={(to) => rename(name, to)}
            onRemove={() => remove(name)}
          />
        ))}
      </div>
    </Section>
  )
}
