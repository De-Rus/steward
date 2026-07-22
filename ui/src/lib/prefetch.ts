import { useEffect, useMemo } from 'react'
import type { QueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import type { TableMeta } from '../api/types'

export function rowQueryKey(table: string, pk: string): [string, string, string] {
  return ['row', table, pk]
}

export function listQueryKey(table: string, qs: string): [string, string, string] {
  return ['list', table, qs]
}

export function defaultListQs(table: TableMeta): string {
  const p = new URLSearchParams()
  p.set('sort', table.list.default_sort)
  p.set('page', '1')
  p.set('pp', String(table.list.per_page))
  return p.toString()
}

export interface Debouncer<T> {
  schedule: (arg: T) => void
  cancel: () => void
}

export function createDebouncer<T>(fn: (arg: T) => void, delay: number): Debouncer<T> {
  let timer: ReturnType<typeof setTimeout> | null = null
  let pending: T | undefined
  let hasPending = false
  return {
    schedule(arg: T) {
      pending = arg
      hasPending = true
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        timer = null
        if (hasPending) fn(pending as T)
        hasPending = false
        pending = undefined
      }, delay)
    },
    cancel() {
      if (timer) clearTimeout(timer)
      timer = null
      hasPending = false
      pending = undefined
    },
  }
}

const PREFETCH_STALE = 30_000

export function useRowPrefetch(qc: QueryClient, tableName: string, delay = 80): Debouncer<string> {
  const deb = useMemo(
    () =>
      createDebouncer<string>((pk) => {
        void qc.prefetchQuery({
          queryKey: rowQueryKey(tableName, pk),
          queryFn: () => api.row(tableName, pk),
          staleTime: PREFETCH_STALE,
        })
      }, delay),
    [qc, tableName, delay],
  )
  useEffect(() => () => deb.cancel(), [deb])
  return deb
}

export function useTablePrefetch(
  qc: QueryClient,
  resolve: (name: string) => TableMeta | undefined,
  delay = 120,
): Debouncer<string> {
  const deb = useMemo(
    () =>
      createDebouncer<string>((name) => {
        const table = resolve(name)
        if (!table) return
        const qs = defaultListQs(table)
        void qc.prefetchQuery({
          queryKey: listQueryKey(name, qs),
          queryFn: () => api.list(name, qs),
          staleTime: PREFETCH_STALE,
        })
      }, delay),
    [qc, resolve, delay],
  )
  useEffect(() => () => deb.cancel(), [deb])
  return deb
}
