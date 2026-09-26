import { useRef, useState } from 'react'
import { Radar } from 'react-chartjs-2'
import { SURVEY_GENRES } from '../lib/genreMap.js'
import { C, radarOptions, wrapLabel } from './charts.js'

export default function GenreCard({ profile }) {
  const chartRef = useRef(null)
  const [showAll, setShowAll] = useState(false)
  const [activeGenre, setActiveGenre] = useState(profile.ranked[0])

  // Top 5: always 5 axes (padded with 0% genres) so the shape stays a pentagon.
  // All 16: the survey's fixed genre order, so everyone's shape is comparable.
  let axes
  if (showAll) {
    axes = SURVEY_GENRES
  } else {
    axes = [...profile.top5]
    for (const g of SURVEY_GENRES) if (axes.length < 5 && !axes.includes(g)) axes.push(g)
  }
  const pctOf = (g) => Math.round(profile.shares[g] * 100)
  const pct = axes.map(pctOf)
  const max = Math.min(100, Math.ceil((Math.max(...pct) + 5) / 10) * 10)
  // Chips are always ranked biggest first
  const chipGenres = [...axes].sort((a, b) => profile.shares[b] - profile.shares[a])

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
    labelSize: showAll ? 11 : 13,
    pointRadius: showAll ? 3.5 : 5,
    tooltipLabel: (ctx) => ` ${ctx.raw}% of your listening`,
    tooltipTitle: (items) => axes[items[0].dataIndex],
  })

  const focus = (g) => {
    setActiveGenre(g)
    const chart = chartRef.current
    const i = axes.indexOf(g)
    if (!chart || i < 0) return
    const el = [{ datasetIndex: 0, index: i }]
    chart.setActiveElements(el)
    chart.tooltip.setActiveElements(el, { x: 0, y: 0 })
    chart.update()
  }

  const toggle = (all) => {
    setShowAll(all)
    if (!all && !profile.top5.includes(activeGenre)) setActiveGenre(profile.ranked[0])
  }

  const genre = axes.includes(activeGenre) ? activeGenre : axes[0]
  const artists = profile.artistsByGenre[genre] || []
  const share = pctOf(genre)

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="eyebrow">01 · your sound</p>
          <h3 className="card-title">{showAll ? 'All 16 genres' : 'Your top 5 genres'}</h3>
        </div>
        <div className="range small toggle" role="radiogroup" aria-label="How many genres to show" data-html2img-ignore>
          <button role="radio" aria-checked={!showAll} className={!showAll ? 'on' : ''} onClick={() => toggle(false)}>Top 5</button>
          <button role="radio" aria-checked={showAll} className={showAll ? 'on' : ''} onClick={() => toggle(true)}>All 16</button>
        </div>
      </div>
      <div className={`chart-box ${showAll ? 'chart-box-all' : ''}`}>
        <Radar ref={chartRef} data={data} options={options} role="img"
          aria-label={`Radar chart of your genres: ${axes.map((g, i) => `${g} ${pct[i]}%`).join(', ')}`} />
      </div>

      <div className="chips" role="tablist" aria-label="Genres">
        {chipGenres.map((g, i) => (
          <button
            key={g}
            role="tab"
            aria-selected={g === genre}
            className={`chip ${g === genre ? 'on' : ''} ${pctOf(g) === 0 && profile.shares[g] === 0 ? 'zero' : ''}`}
            onClick={() => focus(g)}
          >
            <span className="chip-rank">{i + 1}</span>{g}<span className="chip-pct">{pctOf(g)}%</span>
          </button>
        ))}
      </div>
      <p className="artist-line">
        {artists.length
          ? <><b>{genre}</b> comes from {listJoin(artists.slice(0, 4))}{artists.length > 4 ? ` +${artists.length - 4} more` : ''}.</>
          : profile.shares[genre] > 0
            ? <>A little <b>{genre}</b> ({share < 1 ? '<1' : share}%) sneaks in through genre crossovers.</>
            : <>No <b>{genre}</b> in your top artists.</>}
      </p>
    </section>
  )
}

const listJoin = (a) => (a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`)
