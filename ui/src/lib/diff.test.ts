import { describe, expect, it } from 'vitest'
import { lineDiff, diffStat } from './diff'

describe('lineDiff', () => {
  it('marks every line as same for identical input', () => {
    const d = lineDiff('a\nb\nc', 'a\nb\nc')
    expect(d.map((l) => l.op)).toEqual(['same', 'same', 'same'])
    expect(diffStat(d)).toEqual({ added: 0, removed: 0 })
  })

  it('detects a changed line as one del + one add', () => {
    const d = lineDiff('per_page = 50', 'per_page = 25')
    expect(diffStat(d)).toEqual({ added: 1, removed: 1 })
    const del = d.find((l) => l.op === 'del')!
    const add = d.find((l) => l.op === 'add')!
    expect(del.text).toBe('per_page = 50')
    expect(add.text).toBe('per_page = 25')
  })

  it('preserves shared context around edits', () => {
    const d = lineDiff('x\nold\nz', 'x\nnew\nz')
    expect(d.filter((l) => l.op === 'same').map((l) => l.text)).toEqual(['x', 'z'])
    expect(diffStat(d)).toEqual({ added: 1, removed: 1 })
  })

  it('handles pure insertions and deletions against empty', () => {
    expect(diffStat(lineDiff('', 'a\nb'))).toEqual({ added: 2, removed: 0 })
    expect(diffStat(lineDiff('a\nb', ''))).toEqual({ added: 0, removed: 2 })
  })

  it('treats an appended block as additions only', () => {
    const d = lineDiff('a\nb', 'a\nb\nc\nd')
    expect(diffStat(d)).toEqual({ added: 2, removed: 0 })
    expect(d.slice(0, 2).every((l) => l.op === 'same')).toBe(true)
  })

  it('normalizes CRLF so line endings do not read as changes', () => {
    expect(diffStat(lineDiff('a\r\nb', 'a\nb'))).toEqual({ added: 0, removed: 0 })
  })
})
