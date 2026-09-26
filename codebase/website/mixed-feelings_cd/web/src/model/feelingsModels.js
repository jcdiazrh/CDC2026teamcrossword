// The two "Feelings → Music" models. Both are plain math on exported coefficients
// (built by scripts/build_feelings_models.py: src/data/truman_model.json and python_model.json),
// so they run instantly in the browser. The model JSON is passed in by the caller.

const sigmoid = (z) => 1 / (1 + Math.exp(-z))

/** Pick the option most over-represented for you (lift vs base rate), ignoring near-zero ones */
function liftPick(items, minP) {
  const ok = items.filter((i) => i.p >= minP)
  return [...(ok.length ? ok : items)].sort((a, b) => b.lift - a.lift)
}

/**
 * Truman's multinomial model: P(favorite genre = class) from age, the 4 scores and streaming service.
 * Returns items [{ id, p, base, lift }] in class order, plus the pick and the most likely class.
 */
export function trumanPredict(truman, { scores, age, service }) {
  const x = [
    ...truman.numeric.map((k, i) => ((k === 'Age' ? age : scores[k]) - truman.mean[i]) / truman.scale[i]),
    ...truman.services.map((s) => (s === service ? 1 : 0)),
  ]
  const z = truman.intercept.map((b, c) => b + truman.coef[c].reduce((s, w, j) => s + w * x[j], 0))
  const zMax = Math.max(...z)
  const e = z.map((v) => Math.exp(v - zMax))
  const sum = e.reduce((a, b) => a + b, 0)
  const items = truman.classes.map((id, c) => {
    const p = e[c] / sum
    return { id, p, base: truman.base[id], lift: p / truman.base[id] }
  })
  const ranked = liftPick(items, 0.03)
  return {
    items,
    pick: ranked[0],
    distinctive: ranked.filter((i) => i.lift > 1.05).slice(0, 3),
    mostLikely: [...items].sort((a, b) => b.p - a.p)[0],
  }
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
