import { Radar } from 'react-chartjs-2'
import { CONDITIONS, SURVEY_N } from '../model/index.js'
import { C, radarOptions } from './charts.js'

export default function MindCard({ prediction }) {
  const { scores, baseline, improveShare, method } = prediction
  const data = {
    labels: CONDITIONS,
    datasets: [
      {
        label: 'Listeners like you',
        data: CONDITIONS.map((c) => +scores[c].toFixed(1)),
        borderColor: C.you,
        backgroundColor: C.youFill,
        pointBorderColor: C.you,
        fill: true,
      },
      {
        label: `Everyone surveyed (${SURVEY_N})`,
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
      <p className="eyebrow">02 · listeners like you</p>
      <h3 className="card-title">What people with your taste reported</h3>
      <p className="card-sub">
        Self-rated 0–10 scores from survey respondents whose genre habits match yours, next to the whole survey.
      </p>

      <div className="legend">
        <span><i className="key key-you" />Listeners like you</span>
        <span><i className="key key-avg" />Everyone surveyed</span>
      </div>
      <div className="chart-box">
        <Radar data={data} options={options} role="img"
          aria-label={`Radar chart. Listeners like you: ${CONDITIONS.map((c) => `${c} ${scores[c].toFixed(1)}`).join(', ')}. Survey average: ${CONDITIONS.map((c) => `${c} ${baseline[c].toFixed(1)}`).join(', ')}.`} />
      </div>

      <div className="tiles">
        {CONDITIONS.map((c) => {
          const diff = scores[c] - baseline[c]
          const tag = Math.abs(diff) < 0.2 ? 'about average' : `${diff > 0 ? '+' : '−'}${Math.abs(diff).toFixed(1)} vs everyone`
          return (
            <div className="tile" key={c}>
              <span className="tile-label">{c}</span>
              <span className="tile-value">{scores[c].toFixed(1)}<small>/10</small></span>
              <span className="tile-diff">{tag}</span>
            </div>
          )
        })}
      </div>

      {improveShare != null && (
        <div className="callout">
          <span className="callout-num">{Math.round(improveShare * 100)}%</span>
          <span>of listeners like you say music <b>improves</b> their mental health.</span>
        </div>
      )}

      <p className="disclaimer">
        {method} This is a correlation from a voluntary online survey, not a prediction about you and not a diagnosis.
        If you're having a hard time, talk to someone you trust or call or text <b>988</b> (US).
      </p>
    </section>
  )
}
