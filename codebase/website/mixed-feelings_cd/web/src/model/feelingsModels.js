// The two "Feelings → Music" models. Both are plain math on exported coefficients
// (built by scripts/build_feelings_models.py: src/data/truman_model.json and python_model.json),
// so they run instantly in the browser. The model JSON is passed in by the caller.

const sigmoid = (z) => 1 / (1 + Math.exp(-z))

// What counts as a real lean on the Feelings → Music page
export const MIN_LIFT = 1.2 // at least 1.2× as likely as the average person (clearly outside the red ring)
export const MIN_P = 0.08   // and at least an 8% chance of being your favorite

/** Pick the option most over-represented for you (lift vs base rate), ignoring near-zero ones */
function liftPick(items, minP) {
  const ok = items.filter((i) => i.p >= minP)
  return [...(ok.length ? ok : items)].sort((a, b) => b.lift - a.lift)
}

/**
 * Truman's model (fit_mutDepMus2, the "## Model" section of Music_predictor_Truman.qmd):
 * multinomial logistic regression, P(favorite genre = class) from age, the 4 scores and streaming service.
 * truman.W has one row per class (the reference class row is all 0) and one column per term:
 * (Intercept), Age, Anxiety, Depression, Insomnia, OCD, then one 0/1 dummy per non-reference service.
 */
export function trumanPredict(truman, { scores, age, service }) {
  const x = [1, age, scores.Anxiety, scores.Depression, scores.Insomnia, scores.OCD,
    ...truman.services.slice(1).map((s) => (s === service ? 1 : 0))]
  const z = truman.W.map((row) => row.reduce((sum, w, j) => sum + w * x[j], 0))
  const zMax = Math.max(...z)
  const e = z.map((v) => Math.exp(v - zMax))
  const total = e.reduce((a, b) => a + b, 0)
  const items = truman.classes.map((id, c) => {
    const p = e[c] / total
    return { id, p, base: truman.base[id], lift: p / truman.base[id] }
  })
  // A "lean" needs conviction: clearly outside the 1× ring (≥ MIN_LIFT) AND a real chance (≥ MIN_P).
  // Among those, the most likely one is the pick. If none qualify, there is no strong lean.
  const leans = items.filter((i) => i.lift >= MIN_LIFT && i.p >= MIN_P).sort((a, b) => b.p - a.p)
  return {
    items,
    pick: leans[0] || null,
    leans,
    mostLikely: [...items].sort((a, b) => b.p - a.p)[0],
  }
}

/** Rows of the model's tidy() table with p < 0.05 (intercepts left out), for the "what the model says" box */
export function trumanSignificant(truman) {
  return truman.table.filter((t) => t.p < 0.05 && t.term !== '(Intercept)')
}

/**
 * Python notebook model: for each of its 13 genre clusters, P(you listen to it at all)
 * from the 4 standardized scores (one logistic regression per cluster).
 */
export function pythonPredict(pyModel, { scores }) {
  const x = pyModel.inputs.map((k, i) => (scores[k] - pyModel.mean[i]) / pyModel.scale[i])
  const items = pyModel.clusters.map((c) => {
    const p = sigmoid(c.intercept + c.coef.reduce((s, w, j) => s + w * x[j], 0))
    return { id: c.label, p, base: c.prevalence, lift: p / c.prevalence }
  })
  const ranked = liftPick(items, 0.2)
  return {
    items,
    pick: ranked[0],
    distinctive: ranked.filter((i) => i.lift > 1.03).slice(0, 3),
    mostLikely: [...items].sort((a, b) => b.p - a.p)[0],
  }
}
