import { useRef, useState } from 'react'
import { Radar } from 'react-chartjs-2'
import { SURVEY_GENRES } from '../lib/genreMap.js'
import { C, radarOptions, wrapLabel } from './charts.js'

export default function GenreCard({ profile }) {
  const chartRef = useRef(null)
  const [active, setActive] = useState(0)

  // Always 5 axes, so the shape stays a pentagon even for very focused listeners
  const axes = [...profile.top5]
  for (const g of SURVEY_GENRES) if (axes.length < 5 && !axes.includes(g)) axes.push(g)
  const pct = axes.map((g) => Math.round(profile.shares[g] * 100))
  const max = Math.min(100, Math.ceil((Math.max(...pct) + 5) / 10) * 10)

  const data = {
    labels: axes.map(wrapLabel),
    datasets: [{
      label: 'Share of your listening',
      data: pct,
      borderColor: C.you,
      backgroundColor: C.youFill,
      pointBorderColor: C.you,
      fill: true,
    }],
  }
  const options = radarOptions({
    max,
    step: max > 50 ? 20 : 10,
    tooltipLabel: (ctx) => ` ${ctx.raw}% of your listening`,
    tooltipTitle: (items) => axes[items[0].dataIndex],
  })

  const focus = (i) => {
    setActive(i)
    const chart = chartRef.current
    if (!chart) return
    const el = [{ datasetIndex: 0, index: i }]
    chart.setActiveElements(el)
    chart.tooltip.setActiveElements(el, { x: 0, y: 0 })
    chart.update()
  }

  const genre = axes[active]
  const artists = profile.artistsByGenre[genre] || []

  return (
    <section className="card">
      <p className="eyebrow">01 · your sound</p>
      <h3 className="card-title">Your top 5 genres</h3>
      <div className="chart-box">
        <Radar ref={chartRef} data={data} options={options} aria-label={`Radar chart of your top 5 genres: ${axes.map((g, i) => `${g} ${pct[i]}%`).join(', ')}`} role="img" />
      </div>

      <div className="chips" role="tablist" aria-label="Genres">
        {axes.map((g, i) => (
          <button
            key={g}
            role="tab"
            aria-selected={i === active}
            className={`chip ${i === active ? 'on' : ''}`}
            onClick={() => focus(i)}
          >
            <span className="chip-rank">{i + 1}</span>{g}<span className="chip-pct">{pct[i]}%</span>
          </button>
        ))}
      </div>
      <p className="artist-line">
        {artists.length
          ? <><b>{genre}</b> comes from {listJoin(artists.slice(0, 4))}{artists.length > 4 ? ` +${artists.length - 4} more` : ''}.</>
          : <>A little <b>{genre}</b> sneaks in through genre crossovers.</>}
      </p>
    </section>
  )
}

const listJoin = (a) => (a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`)
