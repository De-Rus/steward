export interface FuzzyMatch {
  score: number
  ranges: Array<[number, number]>
}

const WORD_BOUNDARY = /[\s_\-/.]/

export function fuzzyMatch(query: string, text: string): FuzzyMatch | null {
  const q = query.trim().toLowerCase()
  if (!q) return { score: 0, ranges: [] }
  const t = text.toLowerCase()

  const exactIdx = t.indexOf(q)
  if (exactIdx === 0) return { score: 1000, ranges: [[0, q.length]] }

  if (exactIdx > 0) {
    const boundary = WORD_BOUNDARY.test(t[exactIdx - 1])
    return { score: (boundary ? 700 : 500) - exactIdx, ranges: [[exactIdx, exactIdx + q.length]] }
  }

  const ranges: Array<[number, number]> = []
  let ti = 0
  let qi = 0
  let score = 0
  let runStart = -1
  let prevMatched = false
  while (qi < q.length && ti < t.length) {
    if (q[qi] === t[ti]) {
      const atWordStart = ti === 0 || WORD_BOUNDARY.test(t[ti - 1])
      if (atWordStart) score += 15
      if (prevMatched) score += 8
      score += Math.max(0, 10 - ti)
      if (runStart < 0) runStart = ti
      qi += 1
      prevMatched = true
    } else {
      if (runStart >= 0) {
        ranges.push([runStart, ti])
        runStart = -1
      }
      prevMatched = false
    }
    ti += 1
  }
  if (qi < q.length) return null
  if (runStart >= 0) ranges.push([runStart, ti])
  return { score, ranges }
}

export interface Ranked<T> {
  item: T
  match: FuzzyMatch
}

export function fuzzyRank<T>(query: string, items: T[], key: (item: T) => string): Ranked<T>[] {
  const out: Ranked<T>[] = []
  for (const item of items) {
    const match = fuzzyMatch(query, key(item))
    if (match) out.push({ item, match })
  }
  out.sort((a, b) => b.match.score - a.match.score)
  return out
}

export function highlightParts(text: string, ranges: Array<[number, number]>) {
  if (ranges.length === 0) return [{ text, match: false }]
  const parts: Array<{ text: string; match: boolean }> = []
  let pos = 0
  for (const [start, end] of ranges) {
    if (start > pos) parts.push({ text: text.slice(pos, start), match: false })
    parts.push({ text: text.slice(start, end), match: true })
    pos = end
  }
  if (pos < text.length) parts.push({ text: text.slice(pos), match: false })
  return parts
}
