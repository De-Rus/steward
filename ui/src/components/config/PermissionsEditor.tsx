import type { PermissionsData, TableConfigData } from '../../lib/configModel'
import { useT } from '../../lib/i18n'
import { Section, Toggle } from './parts'

export function PermissionsEditor({
  model,
  onChange,
}: {
  model: TableConfigData
  onChange: (m: TableConfigData) => void
}) {
  const t = useT()
  const perms: PermissionsData = model.permissions ?? {}
  const get = (k: keyof PermissionsData) => perms[k] ?? true
  const set = (k: keyof PermissionsData, v: boolean) => {
    const next: PermissionsData = { ...perms }
    // Default is true; only persist an explicit `false`.
    if (v) delete next[k]
    else next[k] = false
    onChange({ ...model, permissions: Object.keys(next).length ? next : undefined })
  }

  return (
    <Section title={t('cfg_tab_permissions')} hint={t('cfg_perms_hint')}>
      <div className="flex flex-wrap gap-2">
        <Toggle checked={get('create')} onChange={(v) => set('create', v)} label={t('cfg_perms_create')} />
        <Toggle checked={get('write')} onChange={(v) => set('write', v)} label={t('cfg_perms_write')} />
        <Toggle checked={get('delete')} onChange={(v) => set('delete', v)} label={t('cfg_perms_delete')} />
      </div>
    </Section>
  )
}
