// Quick end-to-end check of the data pipeline (no browser needed): node scripts/check.mjs
import { readFileSync } from 'node:fs'
import { buildProfile } from '../src/lib/profile.js'
import { makeTitle } from '../src/lib/title.js'
import { mockListening } from '../src/dev/mockListening.js'
import { knnPredict } from '../src/model/knn.js'
import { linearPredict } from '../src/model/linear.js'
import { trumanPredict, pythonPredict } from '../src/model/feelingsModels.js'

const survey = JSON.parse(readFileSync(new URL('../src/data/survey.json', import.meta.url)))
const truman = JSON.parse(readFileSync(new URL('../src/data/truman_model.json', import.meta.url)))
const pyModel = JSON.parse(readFileSync(new URL('../src/data/python_model.json', import.meta.url)))
const linear = JSON.parse(readFileSync(new URL('../src/data/r_model.json', import.meta.url)))
const r1 = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, +v.toFixed(2)]))

for (const kind of ['metal', 'pop', 'mixed']) {
  const p = buildProfile(mockListening(kind))
  const t = makeTitle(p, 'seed')
  const k = knnPredict(p, survey, { k: 50 })
  const l = linearPredict(p, linear, survey)
  console.log(`\n== ${kind}: "${t.adjective} ${t.noun}"  variety=${p.variety.toFixed(2)}`)
  console.log(' groups top5:', p.groupTop5.map((g) => `${g} ${(p.groupShares[g] * 100).toFixed(0)}%`).join(', '))
  console.log(' top5:', p.top5.map((g) => `${g} ${(p.shares[g] * 100).toFixed(0)}%`).join(', '))
  console.log(' levels:', JSON.stringify(p.levels))
  console.log(' untagged:', p.untagged, 'unmatched tags:', p.unmatchedTags)
  console.log(' knn:', r1(k.scores), 'improve', k.improveShare?.toFixed(2))
  console.log(' team model:', r1(l.scores), '| significant for you:', l.effects.filter((e) => e.significant).map((e) => `${e.genre}->${e.condition} ${e.effect.toFixed(2)}`).join(', ') || 'none', '|', l.improveShare && `${Math.round(l.improveShare * 100)}% of ${l.improveGroup} improve`)
  const sum = Object.values(p.shares).reduce((a, b) => a + b, 0)
  if (Math.abs(sum - 1) > 1e-9) throw new Error('shares must sum to 1')
}
for (const [label, sc] of [['calm', { Anxiety: 1, Depression: 1, Insomnia: 1, OCD: 0 }], ['struggling', { Anxiety: 9, Depression: 9, Insomnia: 8, OCD: 6 }]]) {
  const t = trumanPredict(truman, { scores: sc, age: 21, service: 'Spotify' })
  const py = pythonPredict(pyModel, { scores: sc })
  const sum = t.items.reduce((a, b) => a + b.p, 0)
  if (Math.abs(sum - 1) > 1e-6) throw new Error('truman probs must sum to 1')
  console.log(`\n== feelings→music (${label})`)
  console.log(`  truman: pick ${t.pick ? `${t.pick.id} ${(t.pick.p * 100).toFixed(1)}% (${t.pick.lift.toFixed(2)}x)` : "none"}, most likely ${t.mostLikely.id} ${(t.mostLikely.p * 100).toFixed(1)}%`)
  console.log(`  python: pick ${py.pick.id} ${(py.pick.p * 100).toFixed(1)}% (${py.pick.lift.toFixed(2)}x), probs ${py.items.map((i) => `${i.id} ${(i.p * 100).toFixed(0)}`).join(', ')}`)
}
const { trumanSignificant } = await import('../src/model/feelingsModels.js')
console.log('\ntruman significant:', trumanSignificant(truman).map((t) => `${t.level}~${t.term} ${t.estimate}`).join('; '))
console.log('\nbaseline', survey.means, '\nOK')
