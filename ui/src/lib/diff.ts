export type DiffOp = 'same' | 'add' | 'del'

export interface DiffLine {
  op: DiffOp
  text: string
}

export interface DiffStat {
  added: number
  removed: number
}

function splitLines(s: string): string[] {
  return s.length ? s.replace(/\r\n?/g, '\n').split('\n') : []
}

/** Line-level diff of `a` (baseline) → `b` via longest-common-subsequence. */
export function lineDiff(a: string, b: string): DiffLine[] {
  const aLines = splitLines(a)
  const bLines = splitLines(b)
  const n = aLines.length
  const m = bLines.length

  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] =
        aLines[i] === bLines[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }

  const out: DiffLine[] = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (aLines[i] === bLines[j]) {
      out.push({ op: 'same', text: aLines[i] })
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ op: 'del', text: aLines[i] })
      i++
    } else {
      out.push({ op: 'add', text: bLines[j] })
      j++
    }
  }
  while (i < n) out.push({ op: 'del', text: aLines[i++] })
  while (j < m) out.push({ op: 'add', text: bLines[j++] })
  return out
}

export function diffStat(lines: DiffLine[]): DiffStat {
  let added = 0
  let removed = 0
  for (const l of lines) {
    if (l.op === 'add') added++
    else if (l.op === 'del') removed++
  }
  return { added, removed }
}
