export function nextPeekIndex(current: number, dir: -1 | 1, len: number): number {
  if (len <= 0) return -1
  const clampedCurrent = current < 0 ? (dir === 1 ? -1 : len) : current
  const next = clampedCurrent + dir
  if (next < 0) return 0
  if (next > len - 1) return len - 1
  return next
}

export type EmptyKind = 'filtered' | 'first-run' | 'empty'

export function emptyStateKind(opts: { filtered: boolean; canCreate: boolean }): EmptyKind {
  if (opts.filtered) return 'filtered'
  if (opts.canCreate) return 'first-run'
  return 'empty'
}
