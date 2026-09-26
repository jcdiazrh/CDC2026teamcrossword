import { useState } from 'react'

// Card color follows your top genre. It's decoration, not data.
const GENRE_THEME = {
  Metal: 'ink', Rock: 'tomato', Rap: 'ink', 'Hip hop': 'grape', Pop: 'pink', 'K pop': 'pink',
  EDM: 'grape', Lofi: 'mint', Jazz: 'sun', Classical: 'sun', Folk: 'mint', Country: 'sun',
  'R&B': 'grape', Latin: 'tomato', Gospel: 'sun', 'Video game music': 'mint',
}

export default function TitleCard({ name, title, topGenre, rangeLabel, artistCount, onReroll }) {
  const [spin, setSpin] = useState(0)
  const theme = GENRE_THEME[topGenre] || 'tomato'
  const reroll = () => { setSpin((s) => s + 1); onReroll() }

  return (
    <section className={`card title-card theme-${theme}`} aria-live="polite">
      <div className="title-deco" aria-hidden="true">
        <span className="ring" /><span className="ring ring-2" /><span className="star">✦</span>
      </div>
      <p className="eyebrow">{name === 'you' ? 'Your' : `${name}'s`} vibe · {rangeLabel}</p>
      <h2 className="big-title" key={title.adjective + title.noun}>
        <span className="adj">{title.adjective}</span>
        <span className="noun">{title.noun}</span>
      </h2>
      <div className="title-row">
        <span className="pill">from your top {artistCount} artists</span>
        <button className="dice" onClick={reroll} aria-label="Reroll title" title="Reroll title" data-html2img-ignore>
          <span style={{ transform: `rotate(${spin * 180}deg)` }}>⚄</span>
        </button>
      </div>
    </section>
  )
}
