import { describe, expect, it } from 'vitest'
import { DICTS, makeT } from './i18n'

describe('i18n resolver', () => {
  it('resolves override > locale > es fallback > key', () => {
    const t = makeT('en', { save: 'Persist' })
    expect(t('save')).toBe('Persist') // override wins
    expect(t('prev')).toBe('Previous') // en locale
    expect(t('totally_unknown_key')).toBe('totally_unknown_key') // bare key
  })

  it('falls back to es when locale is null or unknown', () => {
    expect(makeT(null)('save')).toBe('Guardar')
    expect(makeT('fr')('save')).toBe('Guardar')
  })

  it('has full es/en key parity', () => {
    expect(Object.keys(DICTS.en).sort()).toEqual(Object.keys(DICTS.es).sort())
  })

  it('interpolates {vars}', () => {
    const t = makeT('en')
    expect(t('rows_affected', { count: 3 })).toBe('3 rows affected')
    expect(t('range_of', { from: 1, to: 50, total: 4212 })).toBe('1–50 of 4212')
    expect(makeT('es')('selected', { count: 2 })).toBe('2 seleccionadas')
  })
})
