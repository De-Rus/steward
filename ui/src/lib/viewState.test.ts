import { describe, expect, it } from 'vitest'
import { applyViewQuery, resolveColumns, viewMatchesParams, viewQueryFromParams } from './viewState'

describe('viewQueryFromParams', () => {
  it('captures only list state, canonically ordered', () => {
    const sp = new URLSearchParams('page=3&q=btc&f_active=true&sort=-id&pp=50&junk=1')
    const q = viewQueryFromParams(sp)
    expect(q).toBe('f_active=true&pp=50&q=btc&sort=-id')
    expect(q).not.toContain('page')
    expect(q).not.toContain('junk')
  })

  it('is stable regardless of source ordering', () => {
    const a = viewQueryFromParams(new URLSearchParams('sort=-id&q=x&f_a=1'))
    const b = viewQueryFromParams(new URLSearchParams('f_a=1&q=x&sort=-id'))
    expect(a).toBe(b)
  })
})

describe('applyViewQuery round-trip', () => {
  it('applied query reproduces the saved state', () => {
    const saved = 'f_status=live&q=grid&sort=-created_at'
    const applied = applyViewQuery(saved, new URLSearchParams('page=2&f_old=1'))
    expect(viewQueryFromParams(applied)).toBe(viewQueryFromParams(new URLSearchParams(saved)))
    expect(applied.get('page')).toBeNull()
    expect(applied.get('f_old')).toBeNull()
    expect(viewMatchesParams(saved, applied)).toBe(true)
  })

  it('detects divergence from the saved view', () => {
    const saved = 'f_status=live'
    const sp = new URLSearchParams('f_status=halted')
    expect(viewMatchesParams(saved, sp)).toBe(false)
  })
})

describe('resolveColumns', () => {
  it('applies order and hides columns', () => {
    const cols = resolveColumns(['a', 'b', 'c'], { order: ['c', 'a'], hidden: ['b'], widths: {} })
    expect(cols).toEqual(['c', 'a'])
  })
  it('appends unordered base columns after ordered ones', () => {
    const cols = resolveColumns(['a', 'b', 'c'], { order: ['c'], hidden: [], widths: {} })
    expect(cols).toEqual(['c', 'a', 'b'])
  })
})
