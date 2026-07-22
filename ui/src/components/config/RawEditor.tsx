import { useT } from '../../lib/i18n'

export function RawEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const t = useT()
  return (
    <div className="space-y-2">
      <div className="text-xxs text-muted">{t('cfg_hcl_hint')}</div>
      <textarea
        className="input w-full font-mono text-[12px] leading-relaxed"
        spellCheck={false}
        rows={22}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
