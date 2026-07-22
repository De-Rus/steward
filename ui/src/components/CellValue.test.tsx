import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import type { ColumnMeta } from '../api/types'
import { CellValue, safeImageSrc } from './CellValue'

function col(over: Partial<ColumnMeta> = {}): ColumnMeta {
  return {
    name: 'c',
    kind: 'text',
    widget: 'number',
    params: {},
    nullable: true,
    readonly: false,
    masked: false,
    fk: null,
    ...over,
  }
}

const html = (c: ColumnMeta, value: unknown) =>
  renderToStaticMarkup(<CellValue col={c} value={value} row={{ c: value }} mode="list" />)

describe('safeImageSrc', () => {
  it('accepts https, http, relative and data:image URLs', () => {
    expect(safeImageSrc('https://cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png')
    expect(safeImageSrc('http://cdn.example.com/a.png')).toBe('http://cdn.example.com/a.png')
    expect(safeImageSrc('/avatars/1.png')).toBe('/avatars/1.png')
    expect(safeImageSrc('avatars/1.png')).toBe('avatars/1.png')
    expect(safeImageSrc('data:image/png;base64,AAAA')).toBe('data:image/png;base64,AAAA')
  })

  it('rejects javascript:, data:text and protocol-relative URLs', () => {
    expect(safeImageSrc('javascript:alert(1)')).toBeNull()
    expect(safeImageSrc('data:text/html,<script>1</script>')).toBeNull()
    expect(safeImageSrc('//evil.example.com/x.png')).toBeNull()
    expect(safeImageSrc('')).toBeNull()
    expect(safeImageSrc(null)).toBeNull()
  })
})

describe('CellValue avatar widget', () => {
  it('renders an img for a safe URL with no-referrer and lazy loading', () => {
    const out = html(col({ widget: 'avatar' }), 'https://cdn.example.com/a.png')
    expect(out).toContain('<img')
    expect(out).toContain('src="https://cdn.example.com/a.png"')
    expect(out).toContain('referrerPolicy="no-referrer"')
    expect(out).toContain('loading="lazy"')
  })

  it('never renders an img src for a javascript: value', () => {
    const out = html(col({ widget: 'avatar' }), 'javascript:alert(1)')
    expect(out).not.toContain('<img')
    expect(out).toContain('javascript:alert(1)')
  })
})

describe('CellValue trend widget', () => {
  it('does not double the sign when a format is applied (arrow carries it)', () => {
    const out = html(col({ widget: 'trend', format: 'number' }), -5)
    expect(out).toContain('▼')
    expect(out).not.toContain('-5')
    expect(out).toContain('5')
  })

  it('keeps abs formatting for positive values', () => {
    const out = html(col({ widget: 'trend', format: 'number' }), 5)
    expect(out).toContain('▲')
    expect(out).toContain('5')
  })
})

describe('CellValue relation drill-through', () => {
  const linked = (c: ColumnMeta, value: unknown, row: Record<string, unknown> = { c: value }) =>
    renderToStaticMarkup(
      <MemoryRouter>
        <CellValue col={c} value={value} row={row} mode="list" />
      </MemoryRouter>,
    )

  it('renders a Link to the target record when ref_table is present', () => {
    const out = linked(
      col({ widget: 'fk', fk: { table: 'bots', label_col: 'name' }, ref_table: 'bots', ref_column: 'id' }),
      42,
      { c: 42, c__label: 'Alpha' },
    )
    expect(out).toContain('href="/bots/42"')
    expect(out).toContain('Alpha')
  })

  it('encodes the value in the target href', () => {
    const out = linked(col({ widget: 'fk', ref_table: 'users', ref_column: 'id' }), 'a b/c')
    expect(out).toContain('href="/users/a%20b%2Fc"')
  })

  it('renders plain text (no link) when the fk target is not exposed', () => {
    const out = linked(col({ widget: 'fk', fk: { table: 'bots', label_col: 'name' } }), 7, {
      c: 7,
      c__label: 'Beta',
    })
    expect(out).not.toContain('<a')
    expect(out).toContain('Beta')
  })

  it('links a non-fk widget too when it carries a ref_table', () => {
    const out = linked(col({ widget: 'number', ref_table: 'bots', ref_column: 'id' }), 3)
    expect(out).toContain('href="/bots/3"')
  })

  it('renders a null value as em-dash, never a link', () => {
    const out = linked(col({ widget: 'fk', ref_table: 'bots', ref_column: 'id' }), null)
    expect(out).not.toContain('<a')
  })
})
