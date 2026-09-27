import { useMemo, useState } from 'react'
import { Radar } from 'react-chartjs-2'
import survey from '../data/survey.json'
import truman from '../data/truman_model.json'
import { trumanPredict, MIN_LIFT, MIN_P } from '../model/feelingsModels.js'
import { radarOptions, wrapLabel } from './charts.js'
import { spotifyTop100 } from '../lib/spotifyPlaylists.js'

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

const YOU = '#8F7CFF'
const LEAN = '#FFC23D' // genres you really lean toward

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
  const which = 'truman' // Truman's model only (team decision); the Python model is no longer shown
  const [scores, setScores] = useState(() =>
    Object.fromEntries(FEELINGS.map((f) => [f.id, Math.round(survey.means[f.id])])))
  const [age, setAge] = useState(truman.ageDefault)
  const [service, setService] = useState('Spotify')
  const set = (id, v) => setScores((s) => ({ ...s, [id]: v }))

  const result = useMemo(() => trumanPredict(truman, { scores, age, service }), [scores, age, service])
  const copy = MODELS[which]
  const pct = (v) => Math.round(v * 100)
  const pct1 = (v) => (v < 0.1 ? (v * 100).toFixed(1) : Math.round(v * 100))
  const labels = result.items.map((i) => i.id)

  // Radar = each genre's multiplier vs the survey (p / base rate). The red ring is 1×: inside = less likely
  // than the average person, outside = more likely. The scale zooms to the spread of values.
  const lifts = result.items.map((i) => i.lift)
  // A genre is a real lean when it's clearly outside the red ring AND has a real chance (see feelingsModels.js)
  const isLean = (i) => i.lift >= MIN_LIFT && i.p >= MIN_P
  const CAP = 3
  const nice = (v, up) => (up ? Math.ceil(v * 4) / 4 : Math.floor(v * 4) / 4)
  const hi = Math.min(CAP, Math.max(1.25, nice(Math.max(...lifts) + 0.05, true)))
  const lo = 0
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
        pointBorderColor: result.items.map((i) => (isLean(i) ? LEAN : YOU)),
        pointBackgroundColor: result.items.map((i) => (isLean(i) ? LEAN : '#211A33')),
        pointRadius: result.items.map((i) => (isLean(i) ? 7 : 3.5)),
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
  options.animation = { duration: 350, easing: 'easeOutQuart' }
  // Leaning genres get a bright label with a star; everything else is dimmed
  options.scales.r.pointLabels.color = (ctx) => (isLean(result.items[ctx.index]) ? LEAN : 'rgba(244, 237, 228, 0.55)')
  options.scales.r.pointLabels.callback = (label, i) => {
    const text = Array.isArray(label) ? label : [label]
    return isLean(result.items[i]) ? [...text.slice(0, -1), `${text[text.length - 1]} ★`] : label
  }
  // Rebuild the chart whenever an input changes, so it can never lag behind the text (seen in Safari)
  const chartKey = `${scores.Anxiety}-${scores.Depression}-${scores.Insomnia}-${scores.OCD}-${age}-${service}`

  const { pick, mostLikely, leans } = result

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
        {pick ? (
          <>
            <p className="feel-lean">You lean toward</p>
            <h2 className="feel-pick" key={pick.id}>{pick.id}</h2>
            <p className="feel-pick-sub">
              A <b>{pct(pick.p)}%</b> chance it's your favorite genre, <b>{pick.lift.toFixed(1)}×</b> the average
              person ({pct1(pick.base)}%), so it sits clearly outside the red ring.{' '}
              {mostLikely.id === pick.id
                ? <>It's also your single most likely favorite.</>
                : <>The single most likely favorite is still <b>{mostLikely.id}</b> ({pct(mostLikely.p)}%), because it's the most popular favorite overall.</>}
            </p>
          </>
        ) : (
          <>
            <p className="feel-lean">No strong lean</p>
            <h2 className="feel-pick feel-pick-none" key="none">Right on the average</h2>
            <p className="feel-pick-sub">
              No genre is both clearly outside the red ring ({MIN_LIFT}× or more) and a real possibility ({pct(MIN_P)}%+ chance).
              Like most people in the survey, your most likely favorite is <b>{mostLikely.id}</b> ({pct(mostLikely.p)}%).
            </p>
          </>
        )}

        <a className="spotify-link" href={spotifyTop100((pick || mostLikely).id)} target="_blank" rel="noopener noreferrer">
          <SpotifyGlyph /> Play Spotify's Top 100 {(pick || mostLikely).id} <span aria-hidden="true">↗</span>
        </a>

        <div className="legend">
          <span><i className="key key-mult" />{copy.you}</span>
          <span><i className="key key-ring" />Red ring = 1× (same as the average person)</span>
          <span><i className="key key-lean" />★ Genres you really lean toward</span>
        </div>
        <div className="chart-box chart-box-all">
          <Radar key={chartKey} data={data} options={options} role="img"
            aria-label={`Radar chart of your multiplier vs the average person: ${result.items.map((i) => `${i.id} ${fmtX(i.lift)}`).join(', ')}`} />
        </div>

        {leans.length > 0 && (
          <div className="feel-block">
            <p className="feel-block-title">Genres you really lean toward</p>
            <p className="feel-block-sub">Outside the red ring ({MIN_LIFT}×+) with at least a {pct(MIN_P)}% chance of being your favorite.</p>
            <ul className="lift-list">
              {leans.map((i) => (
                <li key={i.id}>
                  <span className="lift-name">{i.id}</span>
                  <span className="lift-bar"><span style={{ width: `${Math.min(100, (i.lift - 1) * 50)}%` }} /></span>
                  <span className="lift-num">{i.lift.toFixed(1)}× · {pct(i.p)}%</span>
                  <a className="lift-play" href={spotifyTop100(i.id)} target="_blank" rel="noopener noreferrer"
                    aria-label={`Open Spotify's Top 100 ${i.id}`} title={`Spotify Top 100 ${i.id}`}>▶</a>
                </li>
              ))}
            </ul>
          </div>
        )}

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
