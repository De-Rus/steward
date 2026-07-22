import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  CODE_LANGS,
  CURRENCIES,
  ColumnPicker,
  EnumSelect,
  HTTP_METHODS,
  filterIconNames,
  filterOptions,
  toggleValue,
} from './pickers'

describe('filterOptions', () => {
  it('matches on both value and label, case-insensitively', () => {
    const opts = [
      { value: 'usd', label: 'US Dollar' },
      { value: 'eur', label: 'Euro' },
    ]
    expect(filterOptions(opts, 'dollar').map((o) => o.value)).toEqual(['usd'])
    expect(filterOptions(opts, 'EU').map((o) => o.value)).toEqual(['eur'])
  })

  it('returns all options for an empty query and honours the limit', () => {
    const opts = Array.from({ length: 10 }, (_, i) => ({ value: `c${i}`, label: `c${i}` }))
    expect(filterOptions(opts, '')).toHaveLength(10)
    expect(filterOptions(opts, '', 3)).toHaveLength(3)
  })
})

describe('filterIconNames', () => {
  it('caps results and filters by substring', () => {
    const names = ['bot', 'shield', 'trending-up', 'trending-down', 'box']
    expect(filterIconNames(names, 'trending')).toEqual(['trending-up', 'trending-down'])
    expect(filterIconNames(names, '', 2)).toHaveLength(2)
  })

  it('defaults to a 120-item cap', () => {
    const names = Array.from({ length: 500 }, (_, i) => `icon-${i}`)
    expect(filterIconNames(names, '')).toHaveLength(120)
  })
})

describe('toggleValue', () => {
  it('adds a value when absent and removes it when present', () => {
    expect(toggleValue([], 'a')).toEqual(['a'])
    expect(toggleValue(['a'], 'b')).toEqual(['a', 'b'])
    expect(toggleValue(['a', 'b'], 'a')).toEqual(['b'])
  })
})

describe('constant option lists', () => {
  it('ships the documented enum vocabularies', () => {
    expect(HTTP_METHODS.map((o) => o.value)).toEqual(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
    expect(CURRENCIES.map((o) => o.value)).toContain('USD')
    expect(CURRENCIES.map((o) => o.value)).toContain('EUR')
    expect(CODE_LANGS.map((o) => o.value)).toContain('sql')
    expect(CODE_LANGS.map((o) => o.value)).toContain('python')
  })
})

describe('EnumSelect rendering', () => {
  it('renders an empty option and every provided option', () => {
    const html = renderToStaticMarkup(
      <EnumSelect value={undefined} onChange={() => {}} options={HTTP_METHODS} emptyLabel="default" />,
    )
    expect(html).toContain('>default<')
    expect(html).toContain('>GET<')
    expect(html).toContain('>DELETE<')
  })

  it('surfaces a current value that is not in the option set', () => {
    const html = renderToStaticMarkup(
      <EnumSelect value="ZZZ" onChange={() => {}} options={CURRENCIES} />,
    )
    expect(html).toContain('value="ZZZ"')
  })
})

describe('ColumnPicker rendering', () => {
  it('lists each column, appending the label when it differs from the name', () => {
    const html = renderToStaticMarkup(
      <ColumnPicker
        columns={[{ name: 'symbol' }, { name: 'ex', label: 'Exchange' }]}
        value="symbol"
        onChange={() => {}}
      />,
    )
    expect(html).toContain('>symbol<')
    expect(html).toContain('ex · Exchange')
  })
})
