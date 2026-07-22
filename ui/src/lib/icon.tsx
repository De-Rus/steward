import { DynamicIcon, dynamicIconImports, type IconName } from 'lucide-react/dynamic'

const KNOWN: Set<string> = new Set(Object.keys(dynamicIconImports))

export type IconResolution =
  | { kind: 'lucide'; name: IconName }
  | { kind: 'text'; text: string }
  | null

export function resolveIcon(icon: string | null | undefined): IconResolution {
  if (icon == null) return null
  const s = icon.trim()
  if (!s) return null
  if (KNOWN.has(s)) return { kind: 'lucide', name: s as IconName }
  return { kind: 'text', text: s }
}

export function AppIcon({
  icon,
  size = 15,
  className,
}: {
  icon: string | null | undefined
  size?: number
  className?: string
}) {
  const res = resolveIcon(icon)
  if (!res) return null
  if (res.kind === 'lucide') {
    return (
      <DynamicIcon
        name={res.name}
        size={size}
        className={className}
        aria-hidden
        fallback={() => (
          <span
            className={className}
            style={{ display: 'inline-block', width: size, height: size }}
            aria-hidden
          />
        )}
      />
    )
  }
  return (
    <span className={className} aria-hidden>
      {res.text}
    </span>
  )
}
