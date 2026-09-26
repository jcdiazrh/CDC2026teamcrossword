// Linear regression model: score = intercept + sum(coef[genre] * x[genre]), clipped to 0-10.
//
// Reads src/data/r_model.json (built by scripts/build_r_model.py from the team's R model).
// With coding "binary", x[genre] = 1 if you listen Sometimes or more (level >= 2), else 0,
// the same coding as the R code in musictomentalhealthlm.qmd.

const SIG = 0.05

export function linearPredict(profile, model, survey) {
  const minLevel = model.binaryMinLevel ?? 2
  const x = (g) => {
    const level = profile.levels[g] ?? 0
    return model.coding === 'binary' ? (level >= minLevel ? 1 : 0) : level
  }

  const scores = {}
  const effects = [] // every genre effect that applies to you
  for (const [cond, { intercept, coef, p = {} }] of Object.entries(model.conditions)) {
    let s = intercept
    for (const [g, b] of Object.entries(coef)) {
      const v = x(g)
      s += b * v
      if (v) effects.push({ genre: g, condition: cond, effect: b * v, significant: (p[g] ?? 1) < SIG })
    }
    scores[cond] = Math.min(10, Math.max(0, s))
  }

  // All effects the model found significant, whether or not they apply to you
  const significant = []
  for (const [cond, { coef, p = {} }] of Object.entries(model.conditions)) {
    for (const g of Object.keys(coef)) if ((p[g] ?? 1) < SIG) significant.push({ genre: g, condition: cond, effect: coef[g] })
  }

  // "X% of <top genre> listeners say music improves their mental health" (straight from the survey)
  const top = profile.ranked[0]
  let improveShare = null
  let improveGroup = null
  if (top) {
    const gi = survey.genres.indexOf(top)
    const ei = survey.genres.length + survey.conditions.length
    const rows = survey.rows.filter((r) => r[gi] >= minLevel && r[ei] !== null)
    if (rows.length >= 20) {
      improveShare = rows.filter((r) => r[ei] === 1).length / rows.length
      improveGroup = `${top} listeners`
    }
  }

  return {
    kind: 'regression',
    scores,
    baseline: survey.means,
    improveShare,
    improveGroup,
    effects: effects.sort((a, b) => Math.abs(b.effect) - Math.abs(a.effect)),
    significant,
    listens: Object.keys(Object.values(model.conditions)[0].coef).filter((g) => x(g)),
    fit: model.reportedFit,
    method: `${model.name}: ${model.description} ${model.source}.`,
  }
}
