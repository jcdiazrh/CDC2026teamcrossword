import { useMemo, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { TIME_RANGES } from '../lib/spotify.js'
import { makeTitle } from '../lib/title.js'
import { predict, ACTIVE_MODEL } from '../model/index.js'
import TitleCard from './TitleCard.jsx'
import GenreCard from './GenreCard.jsx'
import MindCard from './MindCard.jsx'
import UnderHood from './UnderHood.jsx'
import { hasLastfmKey } from '../lib/genreSources.js'

export default function Results({ name, userId, profile, timeRange, onTimeRange, onLogout }) {
  const [rolls, setRolls] = useState(0)
  const [model, setModel] = useState(ACTIVE_MODEL)
  const [saving, setSaving] = useState(false)
  const shareRef = useRef(null)

  const title = useMemo(() => makeTitle(profile, `${userId}|${timeRange}|${rolls}`), [profile, userId, timeRange, rolls])
  const prediction = useMemo(() => predict(profile, model), [profile, model])
  const rangeLabel = TIME_RANGES.find((t) => t.id === timeRange)?.label

  const save = async () => {
    setSaving(true)
    try {
      const url = await toPng(shareRef.current, {
        pixelRatio: 2, backgroundColor: '#FFF4E6', cacheBust: true,
        filter: (node) => !(node.dataset && 'html2imgIgnore' in node.dataset), // hide the reroll button
      })
      const a = document.createElement('a')
      a.href = url
      a.download = `mixed-feelings-${title.adjective}-${title.noun}.png`.toLowerCase().replace(/\s+/g, '-')
      a.click()
    } catch {
      alert("Couldn't make the image. Try a screenshot instead!")
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="results">
      <header className="topbar">
        <span className="wordmark">Mixed<span>Feelings</span></span>
        <button className="btn-ghost" onClick={onLogout}>Log out</button>
      </header>

      <div className="range" role="radiogroup" aria-label="Listening time range">
        {TIME_RANGES.map((t) => (
          <button
            key={t.id}
            role="radio"
            aria-checked={t.id === timeRange}
            className={t.id === timeRange ? 'on' : ''}
            onClick={() => t.id !== timeRange && onTimeRange(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {profile.matchedCount === 0 ? (
        <NoGenres profile={profile} onLogout={onLogout} />
      ) : (<>
      <div ref={shareRef} className="share-area">
        <TitleCard
          name={name}
          title={title}
          topGenre={profile.ranked[0]}
          rangeLabel={rangeLabel}
          artistCount={profile.matchedCount}
          onReroll={() => setRolls((r) => r + 1)}
        />
        <GenreCard profile={profile} />
        <MindCard prediction={prediction} />
        <p className="share-foot">mixed feelings · built on the MxMH survey</p>
      </div>

      <button className="btn btn-big" onClick={save} disabled={saving}>
        {saving ? 'Developing your photo…' : 'Save as image'}
      </button>

      </>)}

      <UnderHood profile={profile} model={model} onModel={setModel} />
    </main>
  )
}

function NoGenres({ profile }) {
  return (
    <section className="card title-card theme-sun">
      <p className="eyebrow">Hmm, we hit a wall</p>
      <h2 className="card-title">We couldn't find genres for your artists</h2>
      <p>
        {profile.artistCount === 0
          ? "Spotify didn't send any top artists for this time range. Try another range above, or listen a bit more and come back."
          : `Spotify sent your top ${profile.artistCount} artists, but no genre info for any of them (Spotify has deprecated artist genres).`}
      </p>
      {profile.artistCount > 0 && !hasLastfmKey() && (
        <p>
          <b>Fix:</b> add a free Last.fm API key as <code>VITE_LASTFM_API_KEY</code> (see README), then reload.
        </p>
      )}
    </section>
  )
}
