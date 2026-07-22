import type { ColumnMeta, DetailMeta, SectionMeta, TableMeta } from '../api/types'

export interface FieldGroup {
  title: string
  columns: ColumnMeta[]
  span?: number
  collapsible?: boolean
}

export type DetailMode = 'page' | 'drawer' | 'modal'

const TRAILING = 'Other'

export function groupFields(table: TableMeta, columns: ColumnMeta[]): FieldGroup[] {
  const byName = new Map(columns.map((c) => [c.name, c]))
  const sections: SectionMeta[] = table.sections ?? []

  if (sections.length === 0) {
    return [{ title: '', columns }]
  }

  const placed = new Set<string>()
  const groups: FieldGroup[] = []
  for (const s of sections) {
    const cols: ColumnMeta[] = []
    for (const f of s.fields) {
      const c = byName.get(f)
      if (c && !placed.has(f)) {
        cols.push(c)
        placed.add(f)
      }
    }
    if (cols.length) {
      groups.push({
        title: s.title,
        columns: cols,
        span: s.span ?? undefined,
        collapsible: s.collapsible ?? undefined,
      })
    }
  }

  const leftover = columns.filter((c) => !placed.has(c.name))
  if (leftover.length) {
    const existing = groups.find((g) => g.title === TRAILING)
    if (existing) existing.columns.push(...leftover)
    else groups.push({ title: TRAILING, columns: leftover })
  }

  return groups
}

export function detailColumns(detail?: DetailMeta | null): 1 | 2 | 3 {
  const c = detail?.columns ?? 1
  return c === 3 ? 3 : c === 2 ? 2 : 1
}

export function clampSpan(span: number | null | undefined, columns: number): number {
  const s = span && span > 0 ? Math.floor(span) : 1
  return Math.min(s, columns)
}

const MODES = new Set<DetailMode>(['page', 'drawer', 'modal'])

export function detailMode(detail?: DetailMeta | null): DetailMode {
  const m = detail?.mode
  return m && MODES.has(m as DetailMode) ? (m as DetailMode) : 'page'
}

const META_FIELD = /(_at|_ts)$/

export function isMetaField(name: string, pk: string): boolean {
  if (name === pk) return false
  const n = name.toLowerCase()
  if (META_FIELD.test(n)) return true
  return n === 'id' || n.endsWith('_id')
}

export interface DetailLayout {
  groups: FieldGroup[]
  sidebarFields: string[]
  metaSidebar: boolean
}

export function detailLayout(table: TableMeta): DetailLayout {
  const explicitSidebar = table.detail?.sidebar?.fields

  if ((table.sections ?? []).length > 0) {
    const placed = new Set<string>()
    for (const s of table.sections ?? []) for (const f of s.fields) placed.add(f)
    const sidebarFields =
      explicitSidebar ??
      table.columns.filter((c) => !placed.has(c.name) && isMetaField(c.name, table.pk)).map((c) => c.name)
    const reserved = new Set(sidebarFields)
    const groups = groupFields(table, table.columns)
      .map((g) => ({ ...g, columns: g.columns.filter((c) => !reserved.has(c.name)) }))
      .filter((g) => g.columns.length > 0)
    return {
      groups,
      sidebarFields,
      metaSidebar: !explicitSidebar,
    }
  }

  const reserved = new Set(explicitSidebar ?? [])
  const grouped = new Map<string, ColumnMeta[]>()
  const order: string[] = []
  const main: ColumnMeta[] = []
  const sidebar: string[] = []

  for (const c of table.columns) {
    if (reserved.has(c.name)) continue
    if (c.group) {
      if (!grouped.has(c.group)) {
        grouped.set(c.group, [])
        order.push(c.group)
      }
      grouped.get(c.group)!.push(c)
    } else if (isMetaField(c.name, table.pk)) {
      sidebar.push(c.name)
    } else {
      main.push(c)
    }
  }

  const pk = main.find((c) => c.name === table.pk)
  const mainOrdered = pk ? [pk, ...main.filter((c) => c !== pk)] : main

  const groups: FieldGroup[] = []
  if (mainOrdered.length) groups.push({ title: '', columns: mainOrdered })
  for (const g of order) groups.push({ title: g, columns: grouped.get(g)! })
  if (groups.length === 0) {
    groups.push({ title: '', columns: table.columns.filter((c) => !reserved.has(c.name)) })
  }

  return {
    groups,
    sidebarFields: explicitSidebar ?? sidebar,
    metaSidebar: !explicitSidebar,
  }
}

export function useTabsLayout(detail: DetailMeta | null | undefined, groupCount: number): boolean {
  if (detail?.tabs != null) return detail.tabs
  return groupCount > 3
}
