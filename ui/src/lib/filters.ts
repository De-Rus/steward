import type { FilterOp } from '../api/types'

export interface Condition {
  col: string
  op: FilterOp
  value: string
}

export const OP_LABELS: Record<FilterOp, string> = {
  eq: 'equals',
  ne: 'not equals',
  gt: '>',
  gte: '≥',
  lt: '<',
  lte: '≤',
  contains: 'contains',
  in: 'in',
  between: 'between',
  isnull: 'is empty',
}

export const TEXT_OPS: FilterOp[] = ['eq', 'ne', 'contains', 'in', 'isnull']
export const NUMERIC_OPS: FilterOp[] = ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'between', 'in', 'isnull']

export function opsForKind(kind: string | undefined): FilterOp[] {
  switch (kind) {
    case 'int':
    case 'float':
    case 'money':
    case 'percent':
    case 'datetime':
    case 'date':
      return NUMERIC_OPS
    default:
      return TEXT_OPS
  }
}

const OP_SUFFIXES: FilterOp[] = ['ne', 'gt', 'gte', 'lt', 'lte', 'contains', 'in', 'between', 'isnull']

export function encodeCondition(c: Condition): [string, string] {
  if (c.op === 'eq') return [`f_${c.col}`, c.value]
  const value = c.op === 'isnull' ? (c.value === '0' ? '0' : '1') : c.value
  return [`f_${c.col}__${c.op}`, value]
}

export function decodeParam(key: string, value: string): Condition | null {
  if (!key.startsWith('f_')) return null
  const rest = key.slice(2)
  const usIdx = rest.lastIndexOf('__')
  if (usIdx > 0) {
    const maybeOp = rest.slice(usIdx + 2) as FilterOp
    if (OP_SUFFIXES.includes(maybeOp)) {
      return { col: rest.slice(0, usIdx), op: maybeOp, value }
    }
  }
  return { col: rest, op: 'eq', value }
}

export function conditionsFromParams(entries: Array<[string, string]>): Condition[] {
  const out: Condition[] = []
  for (const [k, v] of entries) {
    const c = decodeParam(k, v)
    if (c) out.push(c)
  }
  return out
}

export function conditionKey(c: Condition): string {
  return encodeCondition(c)[0]
}

export function needsValue(op: FilterOp): boolean {
  return op !== 'isnull'
}
