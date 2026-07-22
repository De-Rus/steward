import { describe, expect, it } from 'vitest'
import { detectFormat, parseCsv, previewImport, summarizeImport } from './importer'

describe('detectFormat', () => {
  it('uses the file extension first', () => {
    expect(detectFormat('data.json', 'x,y')).toBe('json')
    expect(detectFormat('data.csv', '[1]')).toBe('csv')
  })
  it('sniffs the content when the name is ambiguous', () => {
    expect(detectFormat('paste', '  [{"a":1}]')).toBe('json')
    expect(detectFormat('paste', 'a,b\n1,2')).toBe('csv')
  })
})

describe('parseCsv', () => {
  it('parses headers and rows', () => {
    const { headers, rows } = parseCsv('a,b,c\n1,2,3\n4,5,6\n')
    expect(headers).toEqual(['a', 'b', 'c'])
    expect(rows).toEqual([
      ['1', '2', '3'],
      ['4', '5', '6'],
    ])
  })
  it('honors quoted fields with commas, quotes and newlines', () => {
    const { rows } = parseCsv('a,b\n"x,y","he said ""hi""\nnext"')
    expect(rows[0][0]).toBe('x,y')
    expect(rows[0][1]).toBe('he said "hi"\nnext')
  })
  it('ignores blank trailing lines', () => {
    const { rows } = parseCsv('a\n1\n\n')
    expect(rows).toEqual([['1']])
  })
})

describe('previewImport', () => {
  it('coerces CSV scalars and collects columns', () => {
    const p = previewImport('csv', 'id,active,price\n7,true,10.5')
    expect(p.error).toBeNull()
    expect(p.columns).toEqual(['id', 'active', 'price'])
    expect(p.rows[0]).toEqual({ id: 7, active: true, price: 10.5 })
    expect(p.count).toBe(1)
  })
  it('accepts a JSON array and a single object', () => {
    expect(previewImport('json', '[{"a":1},{"a":2}]').count).toBe(2)
    expect(previewImport('json', '{"a":1}').count).toBe(1)
  })
  it('reports JSON parse errors instead of throwing', () => {
    const p = previewImport('json', '{bad')
    expect(p.error).not.toBeNull()
    expect(p.count).toBe(0)
  })
  it('treats empty input as an empty preview', () => {
    expect(previewImport('csv', '   ').count).toBe(0)
    expect(previewImport('csv', '   ').error).toBeNull()
  })
})

describe('summarizeImport', () => {
  it('summarizes non-zero buckets only', () => {
    expect(summarizeImport({ inserted: 3, updated: 0, skipped: 1, errors: [] })).toBe('3 nuevas · 1 omitidas')
    expect(summarizeImport({ inserted: 0, updated: 0, skipped: 0, errors: [] })).toBe('sin cambios')
    expect(summarizeImport({ inserted: 0, updated: 2, skipped: 0, errors: [{ row: 1, message: 'x' }] })).toBe(
      '2 actualizadas · 1 errores',
    )
  })
})
