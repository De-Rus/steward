import { describe, expect, it } from 'vitest'
import type { NavGroup, TableMeta } from '../api/types'
import { buildSidebarNav } from './nav'

function table(name: string, label_plural: string, extra: Partial<TableMeta> = {}): TableMeta {
  return {
    name,
    label: name,
    label_plural,
    group: null,
    pk: 'id',
    read_only: false,
    columns: [],
    list: { columns: [], search: [], filters: [], default_sort: 'id', per_page: 50 },
    display_title: '{id}',
    inlines: [],
    actions: [],
    perms: { read: true, write: true, create: false, delete: false, actions: [] },
    ...extra,
  }
}

const tables = [
  table('bots', 'Bots', { approx_rows: 12, icon: 'bot' }),
  table('bot_notifications', 'Notifications'),
  table('instruments', 'Instruments', { approx_rows: 79 }),
  table('users', 'Users'),
]

const nav: NavGroup[] = [
  { label: 'Trading', icon: 'bot', tables: ['bots', 'bot_notifications'] },
  { label: 'Market data', icon: '📈', tables: ['instruments'] },
  { label: 'Other', icon: null, tables: ['users'] },
]

describe('buildSidebarNav', () => {
  it('returns null when nav is absent or empty (→ legacy fallback)', () => {
    expect(buildSidebarNav(undefined, tables, '')).toBeNull()
    expect(buildSidebarNav([], tables, '')).toBeNull()
  })

  it('preserves group order and table membership from meta.nav', () => {
    const groups = buildSidebarNav(nav, tables, '')!
    expect(groups.map((g) => g.label)).toEqual(['Trading', 'Market data', 'Other'])
    expect(groups[0].tables.map((t) => t.key)).toEqual(['bots', 'bot_notifications'])
    expect(groups[1].tables.map((t) => t.key)).toEqual(['instruments'])
    expect(groups[2].tables.map((t) => t.key)).toEqual(['users'])
  })

  it('routes each table to /{key} and carries label/icon/rows from meta.tables', () => {
    const groups = buildSidebarNav(nav, tables, '')!
    const bots = groups[0].tables[0]
    expect(bots.to).toBe('/bots')
    expect(bots.label).toBe('Bots')
    expect(bots.icon).toBe('bot')
    expect(bots.rows).toBe(12)
    expect(groups[0].tables[1].icon).toBeNull()
  })

  it('places a trailing Other group like any other group', () => {
    const groups = buildSidebarNav(nav, tables, '')!
    const other = groups.at(-1)!
    expect(other.label).toBe('Other')
    expect(other.tables.map((t) => t.key)).toEqual(['users'])
  })

  it('skips keys with no matching table (unreadable/hidden)', () => {
    const groups = buildSidebarNav(
      [{ label: 'X', icon: null, tables: ['ghost', 'bots'] }],
      tables,
      '',
    )!
    expect(groups[0].tables.map((t) => t.key)).toEqual(['bots'])
  })

  it('filters rows by label and hides groups left empty', () => {
    const groups = buildSidebarNav(nav, tables, 'instr')!
    expect(groups.map((g) => g.label)).toEqual(['Market data'])
    expect(groups[0].tables.map((t) => t.key)).toEqual(['instruments'])
  })
})
