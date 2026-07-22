import { describe, expect, it } from 'vitest'
import { conditionsFromParams, decodeParam, encodeCondition, opsForKind } from './filters'

describe('encodeCondition', () => {
  it('encodes eq as a bare f_ param', () => {
    expect(encodeCondition({ col: 'status', op: 'eq', value: 'live' })).toEqual(['f_status', 'live'])
  })
  it('encodes operators with a suffix', () => {
    expect(encodeCondition({ col: 'equity', op: 'gte', value: '1000' })).toEqual([
      'f_equity__gte',
      '1000',
    ])
    expect(encodeCondition({ col: 'name', op: 'contains', value: 'grid' })).toEqual([
      'f_name__contains',
      'grid',
    ])
  })
  it('normalizes isnull to 1/0', () => {
    expect(encodeCondition({ col: 'notes', op: 'isnull', value: '' })[1]).toBe('1')
    expect(encodeCondition({ col: 'notes', op: 'isnull', value: '0' })[1]).toBe('0')
  })
})

describe('decodeParam', () => {
  it('round-trips through encode', () => {
    const conds = [
      { col: 'status', op: 'eq', value: 'live' },
      { col: 'equity', op: 'between', value: '10..20' },
      { col: 'name', op: 'contains', value: 'grid' },
      { col: 'tags', op: 'in', value: 'a,b,c' },
    ] as const
    for (const c of conds) {
      const [k, v] = encodeCondition(c)
      expect(decodeParam(k, v)).toEqual(c)
    }
  })
  it('treats a double-underscore column name as eq when suffix is not an op', () => {
    expect(decodeParam('f_created__at', '2026')).toEqual({
      col: 'created__at',
      op: 'eq',
      value: '2026',
    })
  })
  it('ignores non-filter params', () => {
    expect(decodeParam('sort', '-id')).toBeNull()
  })
})

describe('conditionsFromParams', () => {
  it('collects all filter conditions from entries', () => {
    const conds = conditionsFromParams([
      ['q', 'x'],
      ['f_status', 'live'],
      ['f_equity__gt', '5'],
    ])
    expect(conds).toHaveLength(2)
    expect(conds[1]).toEqual({ col: 'equity', op: 'gt', value: '5' })
  })
})

describe('opsForKind', () => {
  it('gives numeric ops range comparisons', () => {
    expect(opsForKind('float')).toContain('between')
    expect(opsForKind('text')).not.toContain('between')
    expect(opsForKind('text')).toContain('contains')
  })
})
