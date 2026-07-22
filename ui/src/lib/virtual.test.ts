import { describe, expect, it } from 'vitest'
import { adjacentIndex, windowRange } from './virtual'

describe('windowRange', () => {
  it('windows a large list to visible + overscan', () => {
    const r = windowRange(1000, 28, 560, 25000, 8)
    expect(r.start).toBe(1000 / 28 - 8 < 0 ? 0 : Math.floor(1000 / 28) - 8)
    expect(r.start).toBe(27)
    expect(r.end).toBe(Math.floor(1000 / 28) + Math.ceil(560 / 28) + 8)
    expect(r.end).toBe(63)
    expect(r.end - r.start).toBeLessThan(60)
  })
  it('clamps to the ends', () => {
    expect(windowRange(0, 28, 560, 25000, 8).start).toBe(0)
    const tail = windowRange(25000 * 28, 28, 560, 25000, 8)
    expect(tail.end).toBe(25000)
  })
  it('returns an empty range for empty input', () => {
    expect(windowRange(0, 28, 560, 0)).toEqual({ start: 0, end: 0 })
    expect(windowRange(0, 0, 560, 10)).toEqual({ start: 0, end: 0 })
  })
})

describe('adjacentIndex', () => {
  it('moves within bounds and stops at the edges', () => {
    expect(adjacentIndex(3, 10, 1)).toBe(4)
    expect(adjacentIndex(3, 10, -1)).toBe(2)
    expect(adjacentIndex(0, 10, -1)).toBeNull()
    expect(adjacentIndex(9, 10, 1)).toBeNull()
    expect(adjacentIndex(0, 0, 1)).toBeNull()
  })
})
