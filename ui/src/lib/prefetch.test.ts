import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { TableMeta } from '../api/types'
import { createDebouncer, defaultListQs, listQueryKey, rowQueryKey } from './prefetch'

describe('query keys', () => {
  it('rowQueryKey matches the RowDetail query key shape', () => {
    expect(rowQueryKey('bots', '42')).toEqual(['row', 'bots', '42'])
  })

  it('listQueryKey matches the TableList query key shape', () => {
    expect(listQueryKey('bots', 'sort=-id&page=1&pp=50')).toEqual(['list', 'bots', 'sort=-id&page=1&pp=50'])
  })
})

describe('defaultListQs', () => {
  it('reproduces the first-page query string TableList builds', () => {
    const table = {
      name: 'bots',
      list: { default_sort: '-created_at', per_page: 50 },
    } as unknown as TableMeta
    // TableList's apiQs with no q/filters sets sort, then page, then pp — same order.
    expect(defaultListQs(table)).toBe('sort=-created_at&page=1&pp=50')
  })
})

describe('createDebouncer', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('coalesces rapid calls and fires once with the last argument', () => {
    const fn = vi.fn()
    const deb = createDebouncer<string>(fn, 80)
    deb.schedule('a')
    deb.schedule('b')
    deb.schedule('c')
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(80)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('c')
  })

  it('fires again for a call that lands after the window', () => {
    const fn = vi.fn()
    const deb = createDebouncer<string>(fn, 80)
    deb.schedule('a')
    vi.advanceTimersByTime(80)
    deb.schedule('b')
    vi.advanceTimersByTime(80)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenNthCalledWith(1, 'a')
    expect(fn).toHaveBeenNthCalledWith(2, 'b')
  })

  it('cancel prevents a pending call from firing', () => {
    const fn = vi.fn()
    const deb = createDebouncer<string>(fn, 80)
    deb.schedule('a')
    deb.cancel()
    vi.advanceTimersByTime(200)
    expect(fn).not.toHaveBeenCalled()
  })
})
