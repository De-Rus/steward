export interface WindowRange {
  start: number
  end: number
}

export function windowRange(
  scrollTop: number,
  rowH: number,
  viewH: number,
  count: number,
  overscan = 8,
): WindowRange {
  if (count === 0 || rowH <= 0 || viewH <= 0) return { start: 0, end: 0 }
  const first = Math.floor(scrollTop / rowH)
  const visible = Math.ceil(viewH / rowH)
  const start = Math.max(0, first - overscan)
  const end = Math.min(count, first + visible + overscan)
  return { start, end }
}

export function adjacentIndex(current: number, count: number, dir: -1 | 1): number | null {
  if (count === 0) return null
  const next = current + dir
  if (next < 0 || next >= count) return null
  return next
}
