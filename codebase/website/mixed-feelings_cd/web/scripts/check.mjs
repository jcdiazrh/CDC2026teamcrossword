// Quick end-to-end check of the data pipeline (no browser needed): node scripts/check.mjs
import { readFileSync } from 'node:fs'
import { buildProfile } from '../src/lib/profile.js'
import { makeTitle } from '../src/lib/title.js'
import { mockListening } from '../src/dev/mockListening.js'
import { knnPredict } from '../src/model/knn.js'
import { linearPredict } from '../src/model/linear.js'

const survey = JSON.parse(readFileSync(new URL('../src/data/survey.json', import.meta.url)))
const linear = JSON.parse(readFileSync(new URL('../src/data/linear_model.json', import.meta.url)))
const r1 = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, +v.toFixed(2)]))

for (const kind of ['metal', 'pop', 'mixed']) {
  const p = buildProfile(mockListening(kind))
  const t = makeTitle(p, 'seed')
  const k = knnPredict(p, survey, { k: 50 })
  const l = linearPredict(p, linear, survey)
  console.log(`\n== ${kind}: "${t.adjective} ${t.noun}"  variety=${p.variety.toFixed(2)}`)
  console.log(' top5:', p.top5.map((g) => `${g} ${(p.shares[g] * 100).toFixed(0)}%`).join(', '))
  console.log(' levels:', JSON.stringify(p.levels))
  console.log(' untagged:', p.untagged, 'unmatched tags:', p.unmatchedTags)
  console.log(' knn:', r1(k.scores), 'improve', k.improveShare?.toFixed(2))
  console.log(' lin:', r1(l.scores))
  const sum = Object.values(p.shares).reduce((a, b) => a + b, 0)
  if (Math.abs(sum - 1) > 1e-9) throw new Error('shares must sum to 1')
}
console.log('\nbaseline', survey.means, '\nOK')
