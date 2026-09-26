// Default model: "listeners like you".
// Finds the k survey respondents whose 16-genre listening pattern is closest to
// yours and averages their self-reported scores (closer people count more).

export function knnPredict(profile, survey, { k = 50 } = {}) {
  const G = survey.genres.length
  const C = survey.conditions
  const you = survey.genres.map((g) => profile.levels[g] ?? 0)

  const scored = survey.rows.map((row) => {
    let d = 0
    for (let i = 0; i < G; i++) d += (row[i] - you[i]) ** 2
    return { row, d: Math.sqrt(d) }
  })
  scored.sort((a, b) => a.d - b.d)
  const near = scored.slice(0, k)

  const sums = Object.fromEntries(C.map((c) => [c, 0]))
  let wSum = 0, improve = 0, effectN = 0
  for (const { row, d } of near) {
    const w = 1 / (1 + d)
    wSum += w
    C.forEach((c, j) => { sums[c] += w * row[G + j] })
    const effect = row[G + C.length]
    if (effect !== null) { effectN++; if (effect === 1) improve++ }
  }

  return {
    kind: 'neighbors',
    scores: Object.fromEntries(C.map((c) => [c, sums[c] / wSum])),
    baseline: survey.means,
    improveShare: effectN ? improve / effectN : null,
    method: `Average of the ${k} survey respondents (out of ${survey.n}) whose genre habits are closest to yours.`,
  }
}
