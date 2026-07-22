import { describe, expect, it } from 'vitest'
import type { GroupsLayout } from '../api/types'
import { mergeBoard, placementKey, toBoard, type Board } from './ConfigGroups'

function layout(
  groups: Array<{ slug: string; label?: string; icon?: string | null; order?: number; tables: string[] }>,
  ungrouped: string[] = [],
  unconfigured: string[] = [],
): GroupsLayout {
  return {
    writable: true,
    groups: groups.map((g, i) => ({
      slug: g.slug,
      label: g.label ?? g.slug,
      icon: g.icon ?? null,
      order: g.order ?? i,
      tables: g.tables,
    })),
    ungrouped,
    unconfigured,
  }
}

describe('mergeBoard — staged placement survives a metadata refetch', () => {
  const base = layout(
    [
      { slug: 'a', label: 'A', tables: ['t1', 't2'] },
      { slug: 'b', label: 'B', tables: ['t3'] },
    ],
    ['t4'],
  )

  function stageMove(): Board {
    const b = toBoard(base)
    b.groups[0].tables = ['t1']
    b.groups[1].tables = ['t3', 't2']
    return b
  }

  it('keeps a staged card move when a label edit refetches groups', () => {
    const staged = stageMove()
    const refetched = layout(
      [
        { slug: 'a', label: 'Renamed A', tables: ['t1', 't2'] },
        { slug: 'b', label: 'B', tables: ['t3'] },
      ],
      ['t4'],
    )
    const merged = mergeBoard(staged, refetched)
    expect(merged.groups.find((g) => g.slug === 'a')!.tables).toEqual(['t1'])
    expect(merged.groups.find((g) => g.slug === 'b')!.tables).toEqual(['t3', 't2'])
    expect(merged.groups.find((g) => g.slug === 'a')!.label).toBe('Renamed A')
    expect(placementKey(merged)).toBe(placementKey(staged))
  })

  it('adopts fresh column order without clobbering staged placement', () => {
    const staged = stageMove()
    const reordered = layout([
      { slug: 'b', label: 'B', order: 0, tables: ['t3'] },
      { slug: 'a', label: 'A', order: 1, tables: ['t1', 't2'] },
    ], ['t4'])
    const merged = mergeBoard(staged, reordered)
    expect(merged.groups.find((g) => g.slug === 'a')!.order).toBe(1)
    expect(merged.groups.find((g) => g.slug === 'b')!.order).toBe(0)
    expect(merged.groups.find((g) => g.slug === 'b')!.tables).toEqual(['t3', 't2'])
  })

  it('lands a newly adopted table in its group and keeps staged moves', () => {
    const staged = stageMove()
    const withAdopt = layout(
      [
        { slug: 'a', label: 'A', tables: ['t1', 't2', 't5'] },
        { slug: 'b', label: 'B', tables: ['t3'] },
      ],
      ['t4'],
    )
    const merged = mergeBoard(staged, withAdopt)
    expect(merged.groups.find((g) => g.slug === 'a')!.tables).toEqual(['t1', 't5'])
    expect(merged.groups.find((g) => g.slug === 'b')!.tables).toEqual(['t3', 't2'])
  })

  it('adds a brand-new group created while dirty', () => {
    const staged = stageMove()
    const withGroup = layout(
      [
        { slug: 'a', label: 'A', tables: ['t1', 't2'] },
        { slug: 'b', label: 'B', tables: ['t3'] },
        { slug: 'c', label: 'C', tables: [] },
      ],
      ['t4'],
    )
    const merged = mergeBoard(staged, withGroup)
    expect(merged.groups.map((g) => g.slug)).toEqual(['a', 'b', 'c'])
    expect(merged.groups.find((g) => g.slug === 'c')!.tables).toEqual([])
    expect(merged.groups.find((g) => g.slug === 'b')!.tables).toEqual(['t3', 't2'])
  })

  it('drops a table removed on the server from the staged board', () => {
    const staged = stageMove()
    const removed = layout(
      [
        { slug: 'a', label: 'A', tables: ['t1'] },
        { slug: 'b', label: 'B', tables: ['t3'] },
      ],
      ['t4'],
    )
    const merged = mergeBoard(staged, removed)
    const all = [...merged.groups.flatMap((g) => g.tables), ...merged.ungrouped]
    expect(all).not.toContain('t2')
  })
})
