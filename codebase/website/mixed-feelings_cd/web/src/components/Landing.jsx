import { SURVEY_N } from '../model/index.js'

const STICKERS = [
  { t: 'METAL', c: 'tomato', x: '6%', y: '8%', r: -12 },
  { t: 'LOFI', c: 'grape', x: '70%', y: '4%', r: 9 },
  { t: 'K POP', c: 'pink', x: '78%', y: '62%', r: -8 },
  { t: 'JAZZ', c: 'sun', x: '2%', y: '66%', r: 7 },
  { t: 'RAP', c: 'mint', x: '42%', y: '86%', r: -4 },
]

export default function Landing({ onLogin, error, ready }) {
  return (
    <main className="landing">
      <div className="hero-art" aria-hidden="true">
        <div className="blob blob-a" />
        <div className="blob blob-b" />
        <div className="record">
          <div className="record-label"><span>MIXED<br />FEELINGS</span></div>
        </div>
        {STICKERS.map((s) => (
          <span key={s.t} className={`sticker sticker-${s.c}`} style={{ left: s.x, top: s.y, '--r': `${s.r}deg` }}>{s.t}</span>
        ))}
      </div>

      <h1 className="landing-title">
        Your music.<br /><em>Mixed feelings.</em>
      </h1>
      <p className="landing-sub">
        Log in with Spotify. We read your top artists, draw your genre radar, give you a title, and
        show what {SURVEY_N} survey listeners with taste like yours reported about their mood.
      </p>

      <ol className="steps">
        <li><b>1</b> Log in</li>
        <li><b>2</b> We sort 50 artists into 13 genres</li>
        <li><b>3</b> Meet your vibe</li>
      </ol>

      {error && <p className="error" role="alert">{error}</p>}

      {ready ? (
        <button className="btn btn-spotify" onClick={onLogin}>
          <SpotifyGlyph /> Continue with Spotify
        </button>
      ) : (
        <p className="error">
          Setup needed: add <code>VITE_SPOTIFY_CLIENT_ID</code> to <code>.env.local</code> (see README).
        </p>
      )}
      <p className="fine">
        We only ask to read your top artists and tracks. Nothing is stored or sent anywhere except Spotify.
      </p>
    </main>
  )
}

function SpotifyGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="#1ED760" />
      <path d="M6.5 9.3c3.7-1.1 7.9-.8 11.2 1M7.2 12.4c3-.8 6.4-.5 9.1.9M7.8 15.3c2.4-.6 5-.4 7.2.8" stroke="#111" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  )
}
