import { useMemo, useState } from 'react'
import { Radar } from 'react-chartjs-2'
import survey from '../data/survey.json'
import { GROUP_IDS } from '../lib/groups.js'
import { feelingsToMusic } from '../model/reverse.js'
import { CD, radarOptions, wrapLabel } from './charts.js'

const FEELINGS = [
  { id: 'Anxiety', hint: 'Worry, nervousness, feeling on edge' },
  { id: 'Depression', hint: 'Low mood, losing interest in things' },
  { id: 'Insomnia', hint: 'Trouble falling or staying asleep' },
  { id: 'OCD', hint: 'Intrusive thoughts, urges to repeat things' },
]

export default function FeelingsPage() {
  // Start at the survey averages (rounded)
  const [scores, setScores] = useState(() =>
    Object.fromEntries(FEELINGS.map((f) => [f.id, Math.round(survey.means[f.id])])))
  const guess = useMemo(() => feelingsToMusic(scores, survey, { k: 60 }), [scores])
  const set = (id, v) => setScores((s) => ({ ...s, [id]: v }))

  const pctOf = (obj, g) => Math.round(obj[g] * 100)
  const data = {
    labels: GROUP_IDS.map(wrapLabel),
    datasets: [
      {
        label: 'People who feel like you',
        data: GROUP_IDS.map((g) => pctOf(guess.pct, g)),
        borderColor: CD.you,
        backgroundColor: CD.youFill,
        pointBorderColor: CD.you,
        fill: true,
      },
      {
        label: 'Everyone surveyed',
        data: GROUP_IDS.map((g) => pctOf(guess.base, g)),
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
    max: 100,
    step: 25,
    labelSize: 11,
    pointRadius: 3.5,
    tooltipLabel: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw}% listen regularly`,
    tooltipTitle: (items) => GROUP_IDS[items[0].dataIndex],
  })
  options.animation = { duration: 450, easing: 'easeOutQuart' }

  const pick = guess.pick
  const lift = guess.lift[pick]

  return (
    <main className="feelings">
      <header className="topbar">
        <span className="wordmark">Mixed<span>Feelings</span></span>
      </header>

      <section className="feel-hero">
        <p className="eyebrow">feelings → music</p>
        <h1 className="feel-title">How have you been <em>feeling</em> lately?</h1>
        <p className="feel-sub">
          Slide each one from 0 (not at all) to 10 (a lot). We'll guess the music that people who feel like you
          listen to, using the {survey.n} survey responses. Nothing you enter leaves your browser.
        </p>
      </section>

      <section className="card feel-card">
        {FEELINGS.map((f) => (
          <label className="feel-row" key={f.id}>
            <span className="feel-top">
              <span>
                <span className="feel-name">{f.id}</span>
                <span className="feel-hint">{f.hint}</span>
              </span>
              <span className="feel-value" aria-hidden="true">{scores[f.id]}</span>
            </span>
            <input
              type="range" min="0" max="10" step="1"
              value={scores[f.id]}
              style={{ '--pct': `${scores[f.id] * 10}%` }}
              onChange={(e) => set(f.id, Number(e.target.value))}
              aria-valuetext={`${f.id}: ${scores[f.id]} out of 10`}
            />
            <span className="feel-scale" aria-hidden="true"><span>Not at all</span><span>A lot</span></span>
          </label>
        ))}
      </section>

      <section className="card feel-result" aria-live="polite">
        <p className="eyebrow">your predicted soundtrack</p>
        <h2 className="feel-pick" key={pick}>{pick}</h2>
        <p className="feel-pick-sub">
          {Math.round(guess.pct[pick] * 100)}% of the people who feel most like you listen to {pick} regularly
          {lift > 1.05 ? <>, <b>{lift.toFixed(1)}×</b> the survey average ({Math.round(guess.base[pick] * 100)}%).</> : <>, about the same as everyone.</>}
        </p>

        <div className="legend">
          <span><i className="key key-you" />People who feel like you</span>
          <span><i className="key key-avg" />Everyone surveyed</span>
        </div>
        <div className="chart-box chart-box-all">
          <Radar data={data} options={options} role="img"
            aria-label={`Radar chart of the share of people who feel like you who listen to each genre regularly: ${GROUP_IDS.map((g) => `${g} ${pctOf(guess.pct, g)}%`).join(', ')}`} />
        </div>

        {guess.distinctive.length > 0 && (
          <div className="feel-block">
            <p className="feel-block-title">More common than average for people like you</p>
            <ul className="lift-list">
              {guess.distinctive.map((g) => (
                <li key={g}>
                  <span className="lift-name">{g}</span>
                  <span className="lift-bar"><span style={{ width: `${Math.min(100, (guess.lift[g] - 1) * 200)}%` }} /></span>
                  <span className="lift-num">{guess.lift[g].toFixed(2)}×</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {guess.favTop.length > 0 && (
          <div className="callout callout-dark">
            <span className="callout-num">{Math.round(guess.favTop[0].share * 100)}%</span>
            <span>
              of them named <b>{guess.favTop[0].group}</b> as their favorite
              {guess.favTop[1] && <>, then {guess.favTop[1].group} ({Math.round(guess.favTop[1].share * 100)}%)</>}.
            </span>
          </div>
        )}

        <p className="disclaimer">
          Based on the {guess.k} survey respondents (out of {guess.n}) whose four scores are closest to yours;
          "regularly" means they answered Sometimes or Very frequently. How you feel doesn't decide your taste. These are
          small patterns in a voluntary survey, not a diagnosis. If you're having a hard time, talk to someone you
          trust or call or text <b>988</b> (US).
        </p>
      </section>
    </main>
  )
}
