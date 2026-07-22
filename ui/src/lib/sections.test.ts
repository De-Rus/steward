import { describe, expect, it } from 'vitest'
import type { ColumnMeta, DetailMeta, TableMeta } from '../api/types'
import { clampSpan, detailColumns, detailLayout, detailMode, groupFields, isMetaField, useTabsLayout } from './sections'

function col(name: string): ColumnMeta {
  return { name, kind: 'text', widget: 'text', params: {}, nullable: true, readonly: false, masked: false, fk: null }
}

const cols = [col('symbol'), col('exchange'), col('notes'), col('created_at'), col('updated_at')]

function table(sections?: TableMeta['sections']): TableMeta {
  return {
    name: 't',
    label: 't',
    label_plural: 'T',
    group: null,
    pk: 'symbol',
    read_only: false,
    columns: cols,
    list: { columns: [], search: [], filters: [], default_sort: 'symbol', per_page: 50 },
    display_title: '{symbol}',
    inlines: [],
    actions: [],
    perms: { read: true, write: true, create: false, delete: false, actions: [] },
    sections,
  }
}

describe('groupFields', () => {
  it('returns a single untitled group when no sections configured', () => {
    const groups = groupFields(table(), cols)
    expect(groups).toHaveLength(1)
    expect(groups[0].title).toBe('')
    expect(groups[0].columns).toHaveLength(5)
  })

  it('groups fields per section and drops missing/duplicate fields', () => {
    const groups = groupFields(
      table([
        { title: 'Identity', fields: ['symbol', 'exchange', 'ghost'] },
        { title: 'Timestamps', fields: ['created_at', 'updated_at'] },
      ]),
      cols,
    )
    expect(groups.map((g) => g.title)).toEqual(['Identity', 'Timestamps', 'Other'])
    expect(groups[0].columns.map((c) => c.name)).toEqual(['symbol', 'exchange'])
  })

  it('places unlisted fields into a trailing Other group', () => {
    const groups = groupFields(table([{ title: 'Identity', fields: ['symbol'] }]), cols)
    const other = groups.find((g) => g.title === 'Other')!
    expect(other.columns.map((c) => c.name)).toEqual(['exchange', 'notes', 'created_at', 'updated_at'])
  })

  it('does not place a field in two sections', () => {
    const groups = groupFields(
      table([
        { title: 'A', fields: ['symbol'] },
        { title: 'B', fields: ['symbol', 'exchange'] },
      ]),
      cols,
    )
    expect(groups[0].columns.map((c) => c.name)).toEqual(['symbol'])
    expect(groups[1].columns.map((c) => c.name)).toEqual(['exchange'])
  })

  it('carries span and collapsible from the section config', () => {
    const groups = groupFields(
      table([
        { title: 'Wide', fields: ['symbol', 'exchange'], span: 2, collapsible: true },
        { title: 'Rest', fields: ['notes'] },
      ]),
      cols,
    )
    expect(groups[0].span).toBe(2)
    expect(groups[0].collapsible).toBe(true)
    expect(groups[1].span).toBeUndefined()
    expect(groups[1].collapsible).toBeUndefined()
  })
})

describe('detailColumns', () => {
  it('defaults to a single column', () => {
    expect(detailColumns(undefined)).toBe(1)
    expect(detailColumns(null)).toBe(1)
    expect(detailColumns({})).toBe(1)
  })

  it('honors 2 and 3, clamps anything else to 1', () => {
    expect(detailColumns({ columns: 2 })).toBe(2)
    expect(detailColumns({ columns: 3 })).toBe(3)
    expect(detailColumns({ columns: 4 })).toBe(1)
    expect(detailColumns({ columns: 0 })).toBe(1)
  })
})

describe('clampSpan', () => {
  it('never exceeds the column count', () => {
    expect(clampSpan(3, 2)).toBe(2)
    expect(clampSpan(2, 2)).toBe(2)
    expect(clampSpan(1, 3)).toBe(1)
  })

  it('falls back to 1 for empty or invalid spans', () => {
    expect(clampSpan(undefined, 3)).toBe(1)
    expect(clampSpan(null, 3)).toBe(1)
    expect(clampSpan(0, 3)).toBe(1)
    expect(clampSpan(-2, 3)).toBe(1)
  })
})

describe('detailMode', () => {
  it('defaults to page when unset', () => {
    expect(detailMode(undefined)).toBe('page')
    expect(detailMode(null)).toBe('page')
    expect(detailMode({})).toBe('page')
  })

  it('accepts known modes and rejects unknown ones', () => {
    expect(detailMode({ mode: 'drawer' })).toBe('drawer')
    expect(detailMode({ mode: 'modal' })).toBe('modal')
    expect(detailMode({ mode: 'page' })).toBe('page')
    expect(detailMode({ mode: 'popover' } as DetailMeta)).toBe('page')
  })
})

describe('isMetaField', () => {
  it('flags timestamps, id and foreign keys but never the pk', () => {
    expect(isMetaField('created_at', 'symbol')).toBe(true)
    expect(isMetaField('updated_at', 'symbol')).toBe(true)
    expect(isMetaField('inserted_at', 'symbol')).toBe(true)
    expect(isMetaField('last_ts', 'symbol')).toBe(true)
    expect(isMetaField('id', 'symbol')).toBe(true)
    expect(isMetaField('account_id', 'symbol')).toBe(true)
    expect(isMetaField('symbol', 'symbol')).toBe(false)
    expect(isMetaField('id', 'id')).toBe(false)
    expect(isMetaField('notes', 'symbol')).toBe(false)
  })
})

describe('detailLayout', () => {
  it('splits timestamps into a meta sidebar and keeps the rest in a main group', () => {
    const layout = detailLayout(table())
    expect(layout.metaSidebar).toBe(true)
    expect(layout.sidebarFields).toEqual(['created_at', 'updated_at'])
    expect(layout.groups).toHaveLength(1)
    expect(layout.groups[0].title).toBe('')
    expect(layout.groups[0].columns.map((c) => c.name)).toEqual(['symbol', 'exchange', 'notes'])
  })

  it('keeps the primary field first in the main group', () => {
    const t = table()
    t.columns = [col('notes'), col('exchange'), col('symbol'), col('created_at')]
    const layout = detailLayout(t)
    expect(layout.groups[0].columns[0].name).toBe('symbol')
  })

  it('honors per-field group attributes as named sections', () => {
    const t = table()
    t.columns = [
      { ...col('symbol') },
      { ...col('bid'), group: 'Pricing' },
      { ...col('ask'), group: 'Pricing' },
      { ...col('created_at') },
    ]
    const layout = detailLayout(t)
    expect(layout.groups.map((g) => g.title)).toEqual(['', 'Pricing'])
    expect(layout.groups[1].columns.map((c) => c.name)).toEqual(['bid', 'ask'])
    expect(layout.sidebarFields).toEqual(['created_at'])
  })

  it('lets explicit sections win and keeps meta fields where they are placed', () => {
    const t = table([
      { title: 'Identity', fields: ['symbol', 'exchange'] },
      { title: 'Timestamps', fields: ['created_at', 'updated_at'] },
    ])
    const layout = detailLayout(t)
    expect(layout.sidebarFields).toEqual([])
    expect(layout.groups.map((g) => g.title)).toEqual(['Identity', 'Timestamps', 'Other'])
  })

  it('auto-sidebars unplaced meta fields when sections omit them', () => {
    const t = table([{ title: 'Identity', fields: ['symbol', 'exchange'] }])
    const layout = detailLayout(t)
    expect(layout.metaSidebar).toBe(true)
    expect(layout.sidebarFields).toEqual(['created_at', 'updated_at'])
    const other = layout.groups.find((g) => g.title === 'Other')
    expect(other?.columns.map((c) => c.name)).toEqual(['notes'])
    expect(layout.groups.flatMap((g) => g.columns.map((c) => c.name))).not.toContain('created_at')
  })

  it('lets an explicit sidebar win and marks it non-meta', () => {
    const t = table()
    t.detail = { sidebar: { fields: ['exchange'] } }
    const layout = detailLayout(t)
    expect(layout.metaSidebar).toBe(false)
    expect(layout.sidebarFields).toEqual(['exchange'])
    expect(layout.groups[0].columns.map((c) => c.name)).not.toContain('exchange')
  })
})

describe('useTabsLayout', () => {
  it('uses the explicit flag when set', () => {
    expect(useTabsLayout({ tabs: true }, 1)).toBe(true)
    expect(useTabsLayout({ tabs: false }, 9)).toBe(false)
  })

  it('falls back to the >3 heuristic when unset', () => {
    expect(useTabsLayout(undefined, 4)).toBe(true)
    expect(useTabsLayout(undefined, 3)).toBe(false)
    expect(useTabsLayout({}, 4)).toBe(true)
  })
})
