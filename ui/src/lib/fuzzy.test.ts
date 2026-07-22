import { describe, expect, it } from 'vitest'
import { fuzzyMatch, fuzzyRank, highlightParts } from './fuzzy'

describe('fuzzyMatch', () => {
  it('ranks exact prefix highest', () => {
    const prefix = fuzzyMatch('bot', 'Bots')!
    const contains = fuzzyMatch('bot', 'My bot')!
    const sub = fuzzyMatch('bot', 'b-o-t')!
    expect(prefix.score).toBeGreaterThan(contains.score)
    expect(contains.score).toBeGreaterThan(sub.score)
  })

  it('returns null when characters are missing', () => {
    expect(fuzzyMatch('xyz', 'Bots')).toBeNull()
  })

  it('empty query matches everything with zero score', () => {
    expect(fuzzyMatch('', 'anything')).toEqual({ score: 0, ranges: [] })
  })

  it('reports match ranges for highlighting', () => {
    const m = fuzzyMatch('bt', 'bots table')!
    expect(m.ranges.length).toBeGreaterThan(0)
  })

  it('favors word-boundary matches', () => {
    const boundary = fuzzyMatch('nt', 'bot notifications')!
    const mid = fuzzyMatch('ot', 'bot notifications')!
    expect(boundary.score).toBeGreaterThan(0)
    expect(mid.score).toBeGreaterThan(0)
  })
})

describe('fuzzyRank', () => {
  it('orders items by score, dropping non-matches', () => {
    const items = ['Bots', 'Instruments', 'Bot notifications', 'Users']
    const ranked = fuzzyRank('bot', items, (s) => s)
    expect(ranked[0].item).toBe('Bots')
    expect(ranked.map((r) => r.item)).not.toContain('Users')
  })
})

describe('highlightParts', () => {
  it('splits text around match ranges', () => {
    const parts = highlightParts('Bots', [[0, 3]])
    expect(parts).toEqual([
      { text: 'Bot', match: true },
      { text: 's', match: false },
    ])
  })
})
