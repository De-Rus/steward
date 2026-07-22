import { describe, expect, it } from 'vitest'
import { emptyStateKind, nextPeekIndex } from './peek'

describe('nextPeekIndex', () => {
  it('moves to the adjacent row', () => {
    expect(nextPeekIndex(2, 1, 10)).toBe(3)
    expect(nextPeekIndex(2, -1, 10)).toBe(1)
  })

  it('clamps at the ends instead of wrapping', () => {
    expect(nextPeekIndex(0, -1, 10)).toBe(0)
    expect(nextPeekIndex(9, 1, 10)).toBe(9)
  })

  it('starts from a sensible edge when no row is active', () => {
    expect(nextPeekIndex(-1, 1, 10)).toBe(0)
    expect(nextPeekIndex(-1, -1, 10)).toBe(9)
  })

  it('returns -1 for an empty list', () => {
    expect(nextPeekIndex(0, 1, 0)).toBe(-1)
    expect(nextPeekIndex(-1, -1, 0)).toBe(-1)
  })

  it('handles a single-row list', () => {
    expect(nextPeekIndex(0, 1, 1)).toBe(0)
    expect(nextPeekIndex(0, -1, 1)).toBe(0)
  })
})

describe('emptyStateKind', () => {
  it('prefers the filtered state over everything', () => {
    expect(emptyStateKind({ filtered: true, canCreate: true })).toBe('filtered')
    expect(emptyStateKind({ filtered: true, canCreate: false })).toBe('filtered')
  })

  it('offers first-run creation when the table is creatable', () => {
    expect(emptyStateKind({ filtered: false, canCreate: true })).toBe('first-run')
  })

  it('falls back to a plain empty state for read-only tables', () => {
    expect(emptyStateKind({ filtered: false, canCreate: false })).toBe('empty')
  })
})
