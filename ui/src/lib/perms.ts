import type { ColumnMeta, TableMeta } from '../api/types'

export function isEditable(table: TableMeta, col: ColumnMeta): boolean {
  return (
    table.perms.write &&
    !table.read_only &&
    !col.readonly &&
    !col.masked &&
    !col.computed &&
    col.name !== table.pk &&
    col.widget !== 'relative_time' &&
    col.widget !== 'binary' &&
    col.widget !== 'image'
  )
}
