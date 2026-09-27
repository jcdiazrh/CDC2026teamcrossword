import { useMemo, useState } from 'react'
import { Radar } from 'react-chartjs-2'
import survey from '../data/survey.json'
import truman from '../data/truman_model.json'
import pyModel from '../data/python_model.json'
import { trumanPredict, pythonPredict, trumanSignificant } from '../model/feelingsModels.js'
import { radarOptions, wrapLabel } from './charts.js'

const FEELINGS = [
  { id: 'Anxiety', hint: 'Worry, nervousness, feeling on edge' },
  { id: 'Depression', hint: 'Low mood, losing interest in things' },
  { id: 'Insomnia', hint: 'Trouble falling or staying asleep' },
  { id: 'OCD', hint: 'Intrusive thoughts, urges to repeat things' },
]
// Platforms offered for Truman's model (values are the survey's own answers)
const PLATFORMS = [
  { value: 'YouTube Music', label: 'YouTube Music' },
  { value: 'Apple Music', label: 'Apple Music' },
  { value: 'Spotify', label: 'Spotify' },
  { value: 'Pandora', label: 'Pandora' },
  { value: 'Other streaming service', label: 'Other' },
]
const RING = '#F2553A' // the red 1× ring

// "Top 100" link for a genre: opens Spotify's playlist search for that genre's top-100 lists.
// (This page needs no login, so we link to Spotify search rather than calling the API.)
const SEARCH_TERMS = {
  'Hip hop & Rap': 'hip hop rap', 'Pop & K-pop': 'pop', 'Rock & Metal': 'rock',
  'Hip hop, R&B & Rap': 'hip hop r&b', 'Metal & Rock': 'rock', 'K pop': 'k-pop',
}
const spotifyTop100 = (genre) =>
  `https://open.spotify.com/search/${encodeURIComponent(`top 100 ${SEARCH_TERMS[genre] || genre.toLowerCase()}`)}/playlists`
const YOU = '#8F7CFF'

// The two models behind this page. "truman" is the default; the slide inside the page switches.
const MODELS = {
  truman: {
    tab: "Truman's model",
    tabSub: 'Your favorite genre',
    eyebrow: "Truman's model · favorite genre",
    you: 'Your multiplier (× as likely to be your favorite)',
    unit: 'chance it’s your favorite',
  },
  python: {
    tab: 'Python model',
    tabSub: 'What you’d listen to',
    eyebrow: 'Python notebook model · listening',
    you: 'Your multiplier (× as likely to listen)',
    unit: 'chance you listen',
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

  // Radar = each genre's multiplier vs the survey (p / base rate). The red ring is 1×: inside = less likely
  // than the average person, outside = more likely. The scale zooms to the spread of values.
  const lifts = result.items.map((i) => i.lift)
  const CAP = 3
  const nice = (v, up) => (up ? Math.ceil(v * 4) / 4 : Math.floor(v * 4) / 4)
  const hi = Math.min(CAP, Math.max(1.25, nice(Math.max(...lifts) + 0.05, true)))
  const lo = which === 'truman' ? 0 : Math.min(0.75, Math.max(0, nice(Math.min(...lifts) - 0.05, false)))
  const step = hi - lo > 2 ? 0.5 : 0.25
  const fmtX = (v) => `${Number(v.toFixed(2))}×`

  const data = {
    labels: labels.map(wrapLabel),
    datasets: [
      {
        label: copy.you,
        data: lifts.map((v) => Math.max(lo, Math.min(hi, v))),
        borderColor: YOU,
        backgroundColor: 'rgba(143, 124, 255, 0.28)',
        pointBorderColor: YOU,
        pointStyle: lifts.map((v) => (v > hi ? 'triangle' : 'circle')),
        fill: true,
      },
      {
        label: '1× = same as the average person',
        data: labels.map(() => 1),
        borderColor: RING,
        borderWidth: 3,
        backgroundColor: 'transparent',
        pointRadius: 0,
        pointHoverRadius: 0,
        pointHitRadius: 0,
        fill: false,
      },
    ],
  }
  const options = radarOptions({
    dark: true,
    min: lo,
    max: hi,
    step,
    labelSize: 11,
    pointRadius: 3.5,
    tickFormat: fmtX,
    tooltipFilter: (ctx) => ctx.datasetIndex === 0,
    tooltipLabel: (ctx) => {
      const it = result.items[ctx.dataIndex]
      return ` ${fmtX(it.lift)} as likely: ${pct1(it.p)}% ${copy.unit} vs ${pct1(it.base)}% on average`
    },
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
            <p className="feel-extra-note">Truman's model also uses your age and the platform you listen on.</p>
            <Slider name="Age" hint="How old you are" value={age} min={10} max={80} onChange={setAge} scale={['10', '80']} />
            <div className="feel-row">
              <span className="feel-name">Which platform do you use?</span>
              <div className="service-pills" role="radiogroup" aria-label="Streaming service">
                {PLATFORMS.map((pl) => (
                  <button key={pl.value} role="radio" aria-checked={service === pl.value} className={service === pl.value ? 'on' : ''} onClick={() => setService(pl.value)}>
                    {pl.label}
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
            average ({pct1(pick.base)}%).{' '}
            {mostLikely.id === pick.id
              ? <>It's also your single most likely favorite.</>
              : <>The single most likely favorite is still <b>{mostLikely.id}</b> ({pct(mostLikely.p)}%), because it's the most popular favorite overall.</>}
          </p>
        ) : (
          <p className="feel-pick-sub">
            A <b>{pct(pick.p)}%</b> chance you listen to {pick.id}, versus {pct(pick.base)}% of everyone surveyed
            {pick.lift > 1.03 ? <> (<b>{pick.lift.toFixed(2)}×</b>)</> : null}.
          </p>
        )}

        <a className="spotify-link" href={spotifyTop100(pick.id)} target="_blank" rel="noopener noreferrer">
          <SpotifyGlyph /> Play Spotify's Top 100 {pick.id} <span aria-hidden="true">↗</span>
        </a>

        <div className="legend">
          <span><i className="key key-mult" />{copy.you}</span>
          <span><i className="key key-ring" />Red ring = 1× (same as the average person)</span>
        </div>
        <div className="chart-box chart-box-all">
          <Radar data={data} options={options} role="img"
            aria-label={`Radar chart of your multiplier vs the average person: ${result.items.map((i) => `${i.id} ${fmtX(i.lift)}`).join(', ')}`} />
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
                  <a className="lift-play" href={spotifyTop100(i.id)} target="_blank" rel="noopener noreferrer"
                    aria-label={`Open Spotify's Top 100 ${i.id}`} title={`Spotify Top 100 ${i.id}`}>▶</a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="model-note">
          {which === 'truman' ? (
            <>
              <b>What the model says.</b> {truman.formula}, a multinomial logistic regression. Effects with p &lt; 0.05,
              compared with the model's reference genre ({truman.reference}):
              <ul className="sig-list">
                {trumanSignificant(truman).map((t) => (
                  <li key={t.level + t.term}>
                    <b>{t.term}</b> {t.estimate > 0 ? '↑' : '↓'} <b>{t.level}</b> as a favorite:
                    odds ×{Math.exp(t.estimate).toFixed(2)} per {t.term === 'Age' ? 'year' : 'point'} <span>(p = {t.p.toFixed(3)})</span>
                  </li>
                ))}
              </ul>
              Everything else in the model wasn't significant, so most of what you see is the survey's overall favorites.
              <span className="model-src">{truman.source}. Fit on {truman.n} survey responses; Rock+Metal, Pop+K pop and Hip hop+Rap merged.</span>
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

function SpotifyGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="#1ED760" />
      <path d="M6.5 9.3c3.7-1.1 7.9-.8 11.2 1M7.2 12.4c3-.8 6.4-.5 9.1.9M7.8 15.3c2.4-.6 5-.4 7.2.8" stroke="#111" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  )
}
