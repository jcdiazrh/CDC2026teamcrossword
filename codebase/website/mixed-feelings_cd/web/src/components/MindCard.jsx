import { Radar } from 'react-chartjs-2'
import { CONDITIONS, SURVEY_N } from '../model/index.js'
import { C, radarOptions } from './charts.js'

const COPY = {
  regression: {
    eyebrow: "02 · the team's model",
    title: 'What our model predicts for your taste',
    sub: `Predicted 0–10 scores for someone who regularly listens to your genres, from our regression on ${SURVEY_N} survey responses, next to the survey average.`,
    you: 'Your predicted score',
  },
  neighbors: {
    eyebrow: '02 · listeners like you',
    title: 'What people with your taste reported',
    sub: 'Self-rated 0–10 scores from survey respondents whose genre habits match yours, next to the whole survey.',
    you: 'Listeners like you',
  },
}

export default function MindCard({ prediction }) {
  const { scores, baseline, improveShare, improveGroup, method, kind = 'neighbors' } = prediction
  const copy = COPY[kind]
  const data = {
    labels: CONDITIONS,
    datasets: [
      {
        label: copy.you,
        data: CONDITIONS.map((c) => +scores[c].toFixed(1)),
        borderColor: C.you,
        backgroundColor: C.youFill,
        pointBorderColor: C.you,
        fill: true,
      },
      {
        label: `Survey average (${SURVEY_N})`,
        data: CONDITIONS.map((c) => +baseline[c].toFixed(1)),
        borderColor: C.avg,
        backgroundColor: 'transparent',
        pointBorderColor: C.avg,
        pointStyle: 'rectRot',
        borderDash: [6, 5],
        fill: false,
      },
    ],
  }
  const options = radarOptions({
    max: 10,
    step: 2,
    startAngle: 45, // labels on the diagonals leave more room for the chart on phones
    showTicks: false, // exact numbers are in the tiles below
    tooltipLabel: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw} / 10`,
  })

  return (
    <section className="card">
      <p className="eyebrow">{copy.eyebrow}</p>
      <h3 className="card-title">{copy.title}</h3>
      <p className="card-sub">{copy.sub}</p>

      <div className="legend">
        <span><i className="key key-you" />{copy.you}</span>
        <span><i className="key key-avg" />Survey average</span>
      </div>
      <div className="chart-box">
        <Radar data={data} options={options} role="img"
          aria-label={`Radar chart. ${copy.you}: ${CONDITIONS.map((c) => `${c} ${scores[c].toFixed(1)}`).join(', ')}. Survey average: ${CONDITIONS.map((c) => `${c} ${baseline[c].toFixed(1)}`).join(', ')}.`} />
      </div>

      <div className="tiles">
        {CONDITIONS.map((c) => {
          const diff = scores[c] - baseline[c]
          const tag = Math.abs(diff) < 0.2 ? 'about average' : `${diff > 0 ? '+' : '−'}${Math.abs(diff).toFixed(1)} vs average`
          return (
            <div className="tile" key={c}>
              <span className="tile-label">{c}</span>
              <span className="tile-value">{scores[c].toFixed(1)}<small>/10</small></span>
              <span className="tile-diff">{tag}</span>
            </div>
          )
        })}
      </div>

      {kind === 'regression' && <Drivers prediction={prediction} />}

      {improveShare != null && (
        <div className="callout">
          <span className="callout-num">{Math.round(improveShare * 100)}%</span>
          <span>of {improveGroup || 'listeners like you'} in the survey say music <b>improves</b> their mental health.</span>
        </div>
      )}

      <p className="disclaimer">
        {method}{' '}
        {kind === 'regression' && prediction.fit && (
          <>On held-out data the typical error was about {avgRmse(prediction.fit)} points, roughly the same as the natural spread of
          scores, so genre alone explains very little. With 64 coefficients tested, a few "significant" ones could be chance.{' '}</>
        )}
        This is a correlation from a voluntary online survey, not a prediction about you and not a diagnosis.
        If you're having a hard time, talk to someone you trust or call or text <b>988</b> (US).
      </p>
    </section>
  )
}

/** The effects the model found statistically significant, and which of them apply to you. */
function Drivers({ prediction }) {
  const { significant, listens } = prediction
  if (!significant?.length) return null
  const mine = significant.filter((s) => listens.includes(s.genre))
  return (
    <div className="drivers">
      <p className="drivers-title">What moved your scores</p>
      <p className="drivers-sub">
        {mine.length
          ? 'Genres you listen to that had a statistically significant effect in our model:'
          : "None of the genres with a significant effect are in your regular rotation, so your prediction stays close to the average. The significant ones were:"}
      </p>
      <ul className="driver-list">
        {(mine.length ? mine : significant).map((s) => (
          <li key={s.genre + s.condition} className={s.effect > 0 ? 'up' : 'down'}>
            <span className="driver-genre">{s.genre}</span>
            <span className="driver-arrow" aria-hidden="true">→</span>
            <span className="driver-cond">{s.condition}</span>
            <span className="driver-eff">{s.effect > 0 ? '+' : '−'}{Math.abs(s.effect).toFixed(2)}</span>
          </li>
        ))}
      </ul>
      {mine.length > 0 && mine.length < significant.length && (
        <p className="drivers-note">
          Also significant, but not in your rotation: {significant.filter((s) => !mine.includes(s))
            .map((s) => `${s.genre} → ${s.condition} (${s.effect > 0 ? '+' : '−'}${Math.abs(s.effect).toFixed(2)})`).join(', ')}.
        </p>
      )}
    </div>
  )
}

const avgRmse = (fit) => {
  const v = Object.values(fit)
  return (v.reduce((s, f) => s + f.rmse, 0) / v.length).toFixed(1)
}
