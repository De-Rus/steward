import type { ColorMeta, ColorRuleMeta } from '../api/types'
import { ageSeconds } from './format'

const COLOR_CLASSES = new Set([
  'text-good',
  'text-warning',
  'text-critical',
  'text-neutral',
  'text-accent',
  'text-muted',
])

function whitelist(cls: string | undefined): string | undefined {
  return cls && COLOR_CLASSES.has(cls) ? cls : undefined
}

function strategyClass(value: unknown, strategy: string): string | undefined {
  switch (strategy) {
    case 'sign': {
      const n = Number(value)
      if (!Number.isFinite(n)) return undefined
      return n > 0 ? 'text-good' : n < 0 ? 'text-critical' : 'text-neutral'
    }
    case 'positive': {
      const n = Number(value)
      return Number.isFinite(n) && n > 0 ? 'text-good' : undefined
    }
    case 'negative': {
      const n = Number(value)
      return Number.isFinite(n) && n < 0 ? 'text-critical' : undefined
    }
    case 'stale': {
      const age = ageSeconds(String(value))
      if (Number.isNaN(age)) return undefined
      if (age > 604800) return 'text-critical'
      if (age > 86400) return 'text-warning'
      return 'text-good'
    }
    default:
      return undefined
  }
}

function ruleMatches(value: unknown, n: number, rule: ColorRuleMeta): boolean {
  switch (rule.op) {
    case 'gt':
      return rule.num != null && n > rule.num
    case 'gte':
      return rule.num != null && n >= rule.num
    case 'lt':
      return rule.num != null && n < rule.num
    case 'lte':
      return rule.num != null && n <= rule.num
    case 'eq':
      return rule.str != null ? String(value) === rule.str : rule.num != null && n === rule.num
    case 'between':
      return rule.num != null && rule.num2 != null && n >= rule.num && n <= rule.num2
    default:
      return false
  }
}

function rulesClass(value: unknown, rules: ColorRuleMeta[]): string | undefined {
  const n = Number(value)
  for (const rule of rules) {
    if (ruleMatches(value, n, rule)) return whitelist(rule.class)
  }
  return undefined
}

export function colorClass(value: unknown, meta: ColorMeta | undefined): string | undefined {
  if (!meta) return undefined
  if ('strategy' in meta) return whitelist(strategyClass(value, meta.strategy))
  if ('rules' in meta) return rulesClass(value, meta.rules)
  return undefined
}

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i
const HSL =
  /^hsla?\(\s*\d{1,3}(?:\.\d+)?\s*,\s*\d{1,3}(?:\.\d+)?%\s*,\s*\d{1,3}(?:\.\d+)?%\s*(?:,\s*(?:0|1|0?\.\d+)\s*)?\)$/i

const NAMED = new Set([
  'red', 'green', 'blue', 'black', 'white', 'gray', 'grey', 'orange', 'yellow', 'purple',
  'violet', 'pink', 'cyan', 'magenta', 'teal', 'navy', 'maroon', 'olive', 'lime', 'aqua',
  'silver', 'gold', 'brown', 'indigo', 'coral', 'salmon', 'khaki', 'crimson', 'turquoise',
  'tomato', 'orchid', 'plum', 'beige', 'tan', 'transparent',
])

export function isCssColor(value: string): boolean {
  const s = value.trim()
  return HEX.test(s) || HSL.test(s) || NAMED.has(s.toLowerCase())
}
