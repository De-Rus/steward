import { createContext, useContext } from 'react'
import type { Meta, TableMeta } from '../api/types'

export const MetaContext = createContext<Meta | null>(null)

export function useMeta(): Meta {
  const meta = useContext(MetaContext)
  if (!meta) throw new Error('MetaContext missing')
  return meta
}

export function useTable(name: string | undefined): TableMeta | undefined {
  const meta = useMeta()
  return meta.tables.find((t) => t.name === name)
}
