// Linear model: score = intercept + sum(coef[genre] * level[genre]), clipped to 0-10.
// Reads coefficients from src/data/linear_model.json. The shipped file is a SAMPLE
// ridge regression built by scripts/build_data.py. Overwrite it with your
// team's model (keep the same JSON format).

export function linearPredict(profile, model, survey) {
  const scores = {}
  for (const [cond, { intercept, coef }] of Object.entries(model.conditions)) {
    let s = intercept
    for (const [g, b] of Object.entries(coef)) s += b * (profile.levels[g] ?? 0)
    scores[cond] = Math.min(10, Math.max(0, s))
  }
  return {
    scores,
    baseline: survey.means,
    improveShare: null,
    method: model.description || 'Linear model on the 16 genre frequencies.',
  }
}
