import { describe, expect, it } from 'vitest'
import type { Row } from '../api/types'
import { inlineRowHidden } from './RowDetail'

const child = (rows: Row[], total: number) => ({ rows, total })

describe('inlineRowHidden', () => {
  it('flags a row_filter-hidden create: pk absent AND total did not grow', () => {
    const before = 3
    const after = child([{ id: '1' }, { id: '2' }, { id: '3' }], 3)
    expect(inlineRowHidden('99', after, before, 'id')).toBe(true)
  })

  it('does not flag a normal create where the pk is now present', () => {
    const before = 3
    const after = child([{ id: '1' }, { id: '2' }, { id: '3' }, { id: '99' }], 4)
    expect(inlineRowHidden('99', after, before, 'id')).toBe(false)
  })

  it('does not flag when the row lands on another page (total grew, pk not visible)', () => {
    const before = 3
    const after = child([{ id: '1' }, { id: '2' }, { id: '3' }], 4)
    expect(inlineRowHidden('99', after, before, 'id')).toBe(false)
  })

  it('does not flag when the refetched inline is missing', () => {
    expect(inlineRowHidden('99', undefined, 3, 'id')).toBe(false)
  })
})
