import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ColumnMeta } from '../../api/types'
import { FieldPreview, sampleValuesFor, syntheticValue } from './FieldPreview'

function col(name: string, kind: string, widget: string): ColumnMeta {
  return {
    name,
    kind,
    widget,
    params: {},
    nullable: true,
    readonly: false,
    masked: false,
    fk: null,
  }
}

describe('syntheticValue', () => {
  it('keys off the widget first', () => {
    expect(syntheticValue('text', 'badge')).toBe('active')
    expect(syntheticValue('text', 'toggle')).toBe(true)
    expect(typeof syntheticValue('text', 'money')).toBe('number')
  })

  it('falls back to the column kind when the widget is plain', () => {
    expect(syntheticValue('int', 'text')).toBe(42)
    expect(syntheticValue('bool', 'text')).toBe(true)
    expect(syntheticValue('text', 'text')).toBe('Sample')
  })
})

describe('sampleValuesFor', () => {
  const c = col('price', 'float', 'money')

  it('pulls up to `count` real, non-null values from the rows', () => {
    const rows = [{ price: 1 }, { price: null }, { price: 3 }, { price: 4 }, { price: 5 }]
    expect(sampleValuesFor(c, rows, 'money', 3)).toEqual([1, 3, 4])
  })

  it('falls back to a single synthetic value when no rows have a value', () => {
    expect(sampleValuesFor(c, [], 'money')).toEqual([syntheticValue('float', 'money')])
    expect(sampleValuesFor(c, [{ price: null }], 'money')).toEqual([syntheticValue('float', 'money')])
  })
})

describe('FieldPreview rendering', () => {
  it('renders a badge widget from a sample value', () => {
    const html = renderToStaticMarkup(
      <FieldPreview column={col('status', 'text', 'badge')} widget="badge" params={{}} sampleValues={['active']} />,
    )
    expect(html).toContain('badge')
    expect(html).toContain('active')
  })

  it('formats a money widget as currency', () => {
    const html = renderToStaticMarkup(
      <FieldPreview
        column={col('equity', 'float', 'money')}
        widget="money"
        params={{ currency: 'EUR' }}
        sampleValues={[1234.5]}
      />,
    )
    expect(html).toContain('€')
  })
})
