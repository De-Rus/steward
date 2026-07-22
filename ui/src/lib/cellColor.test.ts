import { describe, expect, it } from 'vitest'
import type { ColorMeta } from '../api/types'
import { colorClass, isCssColor } from './cellColor'

describe('colorClass — strategies', () => {
  it('sign maps positive/negative/zero', () => {
    const m: ColorMeta = { strategy: 'sign' }
    expect(colorClass(5, m)).toBe('text-good')
    expect(colorClass(-5, m)).toBe('text-critical')
    expect(colorClass(0, m)).toBe('text-neutral')
    expect(colorClass('nope', m)).toBeUndefined()
  })
  it('positive/negative only fire on their side', () => {
    expect(colorClass(5, { strategy: 'positive' })).toBe('text-good')
    expect(colorClass(-5, { strategy: 'positive' })).toBeUndefined()
    expect(colorClass(-5, { strategy: 'negative' })).toBe('text-critical')
    expect(colorClass(5, { strategy: 'negative' })).toBeUndefined()
  })
  it('stale grades by age', () => {
    const m: ColorMeta = { strategy: 'stale' }
    const now = new Date().toISOString()
    const twoDays = new Date(Date.now() - 2 * 86400_000).toISOString()
    const twoWeeks = new Date(Date.now() - 14 * 86400_000).toISOString()
    expect(colorClass(now, m)).toBe('text-good')
    expect(colorClass(twoDays, m)).toBe('text-warning')
    expect(colorClass(twoWeeks, m)).toBe('text-critical')
  })
  it('ignores an unknown strategy', () => {
    expect(colorClass(1, { strategy: 'bogus' })).toBeUndefined()
  })
})

describe('colorClass — rules and each op', () => {
  const rule = (op: string, extra: Record<string, unknown> = {}) => ({
    rules: [{ op, class: 'text-good', ...extra }],
  }) as ColorMeta

  it('evaluates every comparison op', () => {
    expect(colorClass(10, rule('gt', { num: 5 }))).toBe('text-good')
    expect(colorClass(5, rule('gt', { num: 5 }))).toBeUndefined()
    expect(colorClass(5, rule('gte', { num: 5 }))).toBe('text-good')
    expect(colorClass(3, rule('lt', { num: 5 }))).toBe('text-good')
    expect(colorClass(5, rule('lte', { num: 5 }))).toBe('text-good')
    expect(colorClass(5, rule('eq', { num: 5 }))).toBe('text-good')
    expect(colorClass('live', rule('eq', { str: 'live' }))).toBe('text-good')
    expect(colorClass(7, rule('between', { num: 5, num2: 9 }))).toBe('text-good')
    expect(colorClass(12, rule('between', { num: 5, num2: 9 }))).toBeUndefined()
  })
  it('returns the first matching rule and whitelists the class', () => {
    const meta: ColorMeta = {
      rules: [
        { op: 'lt', num: 0, class: 'text-critical' },
        { op: 'gte', num: 0, class: 'text-good' },
      ],
    }
    expect(colorClass(-1, meta)).toBe('text-critical')
    expect(colorClass(3, meta)).toBe('text-good')
  })
  it('rejects a non-whitelisted class name', () => {
    expect(colorClass(1, { rules: [{ op: 'gt', num: 0, class: 'evil-class' }] })).toBeUndefined()
  })
  it('is undefined with no meta', () => {
    expect(colorClass(1, undefined)).toBeUndefined()
  })
})

describe('isCssColor', () => {
  it('accepts strict hex, hsl and named colors', () => {
    expect(isCssColor('#3987e5')).toBe(true)
    expect(isCssColor('#abc')).toBe(true)
    expect(isCssColor('hsl(210, 70%, 55%)')).toBe(true)
    expect(isCssColor('hsla(210, 70%, 55%, 0.5)')).toBe(true)
    expect(isCssColor('red')).toBe(true)
    expect(isCssColor('TRANSPARENT')).toBe(true)
  })
  it('rejects anything that could break out of a style value', () => {
    expect(isCssColor('red; background:url(x)')).toBe(false)
    expect(isCssColor('url(javascript:alert(1))')).toBe(false)
    expect(isCssColor('expression(1)')).toBe(false)
    expect(isCssColor('#12g4')).toBe(false)
    expect(isCssColor('notacolor')).toBe(false)
  })
})
