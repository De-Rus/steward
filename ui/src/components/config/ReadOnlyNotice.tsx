import { useState } from 'react'
import { useT } from '../../lib/i18n'

export function ReadOnlyNotice({ hcl, file, onBack }: { hcl: string; file: string; onBack?: () => void }) {
  const t = useT()
  const [copied, setCopied] = useState(false)
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
            {copied ? t('cfg_copied') : t('cfg_copy')}
          </button>
          {onBack && (
            <button type="button" className="btn" onClick={onBack}>
              {t('cfg_readonly_back')}
            </button>
          )}
        </div>
      </div>
      <pre className="max-h-[50vh] overflow-auto rounded-card border bg-page p-3 font-mono text-[12px] leading-relaxed text-sec">
        {hcl}
      </pre>
    </div>
  )
}
