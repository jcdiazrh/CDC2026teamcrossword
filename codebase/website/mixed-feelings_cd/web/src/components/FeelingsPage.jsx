import { useMemo, useState } from 'react'
import { Radar } from 'react-chartjs-2'
import survey from '../data/survey.json'
import truman from '../data/truman_model.json'
import pyModel from '../data/python_model.json'
import { trumanPredict, pythonPredict } from '../model/feelingsModels.js'
import { CD, radarOptions, wrapLabel } from './charts.js'

const FEELINGS = [
  { id: 'Anxiety', hint: 'Worry, nervousness, feeling on edge' },
  { id: 'Depression', hint: 'Low mood, losing interest in things' },
  { id: 'Insomnia', hint: 'Trouble falling or staying asleep' },
  { id: 'OCD', hint: 'Intrusive thoughts, urges to repeat things' },
]
const SERVICE_LABEL = { 'I do not use a streaming service.': 'None', 'Other streaming service': 'Other' }

// The two models behind this page. "truman" is the default; the slide inside the page switches.
const MODELS = {
  truman: {
    tab: "Truman's model",
    tabSub: 'Your favorite genre',
    eyebrow: "Truman's model · favorite genre",
    you: 'Chance it’s your favorite',
    base: 'Share of survey favorites',
  },
  python: {
    tab: 'Python model',
    tabSub: 'What you’d listen to',
    eyebrow: 'Python notebook model · listening',
    you: 'Chance you listen to it',
    base: 'Everyone surveyed',
  },
}

export default function FeelingsPage() {
  const [which, setWhich] = useState('truman')
  const [scores, setScores] = useState(() =>
    Object.fromEntries(FEELINGS.map((f) => [f.id, Math.round(survey.means[f.id])])))
  const [age, setAge] = useState(truman.ageDefault)
  const [service, setService] = useState('Spotify')
  const set = (id, v) => setScores((s) => ({ ...s, [id]: v }))

  const result = useMemo(
    () => (which === 'truman' ? trumanPredict(truman, { scores, age, service }) : pythonPredict(pyModel, { scores })),
    [which, scores, age, service],
  )
  const copy = MODELS[which]
  const pct = (v) => Math.round(v * 100)
  const pct1 = (v) => (v < 0.1 ? (v * 100).toFixed(1) : Math.round(v * 100))
  const labels = result.items.map((i) => i.id)
  const maxVal = Math.max(...result.items.flatMap((i) => [i.p, i.base]))
  const max = which === 'python' ? 100 : Math.min(100, Math.ceil((maxVal * 100 + 5) / 10) * 10)

  const data = {
    labels: labels.map(wrapLabel),
    datasets: [
      {
        label: copy.you,
        data: result.items.map((i) => +(i.p * 100).toFixed(1)),
        borderColor: CD.you,
        backgroundColor: CD.youFill,
        pointBorderColor: CD.you,
        fill: true,
      },
      {
        label: copy.base,
        data: result.items.map((i) => +(i.base * 100).toFixed(1)),
        borderColor: CD.avg,
        backgroundColor: 'transparent',
        pointBorderColor: CD.avg,
        pointStyle: 'rectRot',
        borderDash: [6, 5],
        fill: false,
      },
    ],
  }
  const options = radarOptions({
    dark: true,
    max,
    step: max > 50 ? 25 : 10,
    labelSize: 11,
    pointRadius: 3.5,
    tooltipLabel: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw}%`,
    tooltipTitle: (items) => labels[items[0].dataIndex],
  })
  options.animation = { duration: 450, easing: 'easeOutQuart' }

  const { pick, mostLikely, distinctive } = result

  return (
    <main className="feelings">
      <header className="topbar">
        <span className="wordmark">Mixed<span>Feelings</span></span>
      </header>

      <section className="feel-hero">
        <p className="eyebrow">feelings → music</p>
        <h1 className="feel-title">How have you been <em>feeling</em> lately?</h1>
        <p className="feel-sub">
          Slide each one from 0 (not at all) to 10 (a lot) and our models will guess your music taste from the {survey.n} survey
          responses. Nothing you enter leaves your browser.
        </p>
      </section>

      {/* The slide inside this page: Truman's model <-> Python notebook model */}
      <div className={`model-slide ${which === 'python' ? 'is-python' : ''}`} role="radiogroup" aria-label="Which model to use">
        <span className="model-slide-thumb" aria-hidden="true" />
        {Object.entries(MODELS).map(([id, m]) => (
          <button key={id} role="radio" aria-checked={which === id} className={which === id ? 'on' : ''} onClick={() => setWhich(id)}>
            <b>{m.tab}</b><small>{m.tabSub}</small>
          </button>
        ))}
      </div>

      <section className="card feel-card">
        {FEELINGS.map((f) => (
          <Slider key={f.id} name={f.id} hint={f.hint} value={scores[f.id]} min={0} max={10}
            onChange={(v) => set(f.id, v)} scale={['Not at all', 'A lot']} />
        ))}

        {which === 'truman' && (
          <div className="feel-extra">
            <p className="feel-extra-note">Truman's model also uses your age and streaming service.</p>
            <Slider name="Age" hint="How old you are" value={age} min={10} max={80} onChange={setAge} scale={['10', '80']} />
            <div className="feel-row">
              <span className="feel-name">Streaming service</span>
              <div className="service-pills" role="radiogroup" aria-label="Streaming service">
                {truman.services.map((s) => (
                  <button key={s} role="radio" aria-checked={service === s} className={service === s ? 'on' : ''} onClick={() => setService(s)}>
                    {SERVICE_LABEL[s] || s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="card feel-result" aria-live="polite">
        <p className="eyebrow">{copy.eyebrow}</p>
        <p className="feel-lean">You lean toward</p>
        <h2 className="feel-pick" key={which + pick.id}>{pick.id}</h2>
        {which === 'truman' ? (
          <p className="feel-pick-sub">
            A <b>{pct1(pick.p)}%</b> chance it's your favorite genre, <b>{pick.lift.toFixed(1)}×</b> the survey
            average ({pct1(pick.base)}%). The single most likely favorite is still <b>{mostLikely.id}</b> ({pct(mostLikely.p)}%),
            because it's the most popular favorite overall.
          </p>
        ) : (
          <p className="feel-pick-sub">
            A <b>{pct(pick.p)}%</b> chance you listen to {pick.id}, versus {pct(pick.base)}% of everyone surveyed
            {pick.lift > 1.03 ? <> (<b>{pick.lift.toFixed(2)}×</b>)</> : null}.
          </p>
        )}

        <div className="legend">
          <span><i className="key key-you" />{copy.you}</span>
          <span><i className="key key-avg" />{copy.base}</span>
        </div>
        <div className="chart-box chart-box-all">
          <Radar data={data} options={options} role="img"
            aria-label={`Radar chart. ${copy.you}: ${result.items.map((i) => `${i.id} ${pct1(i.p)}%`).join(', ')}`} />
        </div>

        {distinctive.length > 0 && (
          <div className="feel-block">
            <p className="feel-block-title">Bigger for you than for the average person</p>
            <ul className="lift-list">
              {distinctive.map((i) => (
                <li key={i.id}>
                  <span className="lift-name">{i.id}</span>
                  <span className="lift-bar"><span style={{ width: `${Math.min(100, (i.lift - 1) * (which === 'truman' ? 50 : 250))}%` }} /></span>
                  <span className="lift-num">{i.lift.toFixed(2)}×</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="model-note">
          {which === 'truman' ? (
            <>
              <b>How good is it?</b> On the held-out {truman.test.n} survey responses it picked the right favorite
              {' '}{pct(truman.test.accuracy)}% of the time, versus {pct(truman.test.majorityAccuracy)}% for always
              guessing {truman.test.majorityClass}. As Truman noted, feelings alone barely predict a favorite genre.
              <span className="model-src">{truman.source}. Rock+Metal, Pop+K pop and Hip hop+Rap are merged, as in the .qmd.</span>
            </>
          ) : (
            <>
              <b>How good is it?</b> In 5-fold cross-validation its average AUC was {pyModel.reported.macroAuc} (0.5 = coin
              flip; base-rate baseline {pyModel.reported.baselineAuc}). A permutation test says that's better than chance
              (p {pyModel.reported.permutationP}), but the signal is weak. "Listen" means answering anything but Never.
              <span className="model-src">{pyModel.source}. Genre clusters were chosen by the notebook from listening correlations.</span>
            </>
          )}
        </div>

        <p className="disclaimer">
          How you feel doesn't decide your taste. These are small patterns in a voluntary survey, not a diagnosis.
          If you're having a hard time, talk to someone you trust or call or text <b>988</b> (US).
        </p>
      </section>
    </main>
  )
}

function Slider({ name, hint, value, min, max, onChange, scale }) {
  return (
    <label className="feel-row">
      <span className="feel-top">
        <span>
          <span className="feel-name">{name}</span>
          <span className="feel-hint">{hint}</span>
        </span>
        <span className="feel-value" aria-hidden="true">{value}</span>
      </span>
      <input
        type="range" min={min} max={max} step="1" value={value}
        style={{ '--pct': `${((value - min) / (max - min)) * 100}%` }}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={`${name}: ${value}`}
      />
      <span className="feel-scale" aria-hidden="true"><span>{scale[0]}</span><span>{scale[1]}</span></span>
    </label>
  )
}
