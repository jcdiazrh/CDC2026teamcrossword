// "Feelings → Music": the reverse direction.
// You enter your four 0–10 scores; we find the survey respondents whose scores are
// closest to yours and look at what THEY listen to, compared with everyone.
//
// "Listens to" = answered Sometimes or Very frequently (the same 0/1 coding as the
// team's R model), computed for the 13 display groups (a group counts if you
// listen to any of its genres).

import { GROUPS, GROUP_OF } from '../lib/groups.js'

export function feelingsToMusic(input, survey, { k = 60 } = {}) {
  const G = survey.genres.length
  const C = survey.conditions
  const favCol = G + C.length + 1
  const you = C.map((c) => input[c] ?? 0)
  const gIndex = GROUPS.map((g) => g.members.map((m) => survey.genres.indexOf(m)))
  const listens = (row, gi) => gIndex[gi].some((i) => row[i] >= 2)

  const scored = survey.rows.map((row) => {
    let d = 0
    for (let j = 0; j < C.length; j++) d += (row[G + j] - you[j]) ** 2
    return { row, d: Math.sqrt(d) }
  })
  scored.sort((a, b) => a.d - b.d)
  const near = scored.slice(0, k)

  const pct = {}, base = {}, lift = {}
  GROUPS.forEach((g, gi) => {
    let w = 0, hit = 0
    for (const { row, d } of near) {
      const wt = 1 / (1 + d)
      w += wt
      if (listens(row, gi)) hit += wt
    }
    pct[g.id] = hit / w
    base[g.id] = survey.rows.filter((r) => listens(r, gi)).length / survey.rows.length
    lift[g.id] = base[g.id] ? pct[g.id] / base[g.id] : 1
  })

  // Favorite genres among the people closest to you (grouped)
  const favCounts = {}
  for (const { row } of near) {
    const f = row[favCol]
    if (f == null) continue
    const grp = GROUP_OF[survey.genres[f]]
    favCounts[grp] = (favCounts[grp] || 0) + 1
  }
  const favTotal = Object.values(favCounts).reduce((a, b) => a + b, 0) || 1
  const favTop = Object.entries(favCounts).sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([group, n]) => ({ group, share: n / favTotal }))

  // The pick: the most over-represented group that people like you actually play (≥ 30%)
  const candidates = GROUPS.map((g) => g.id).filter((g) => pct[g] >= 0.3)
  const byLift = [...(candidates.length ? candidates : GROUPS.map((g) => g.id))].sort((a, b) => lift[b] - lift[a])

  return {
    k,
    n: survey.n,
    pct,
    base,
    lift,
    pick: byLift[0],
    distinctive: byLift.filter((g) => lift[g] > 1.05).slice(0, 3),
    favTop,
  }
}
