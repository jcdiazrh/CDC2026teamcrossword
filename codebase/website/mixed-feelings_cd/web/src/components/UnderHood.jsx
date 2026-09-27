import { SURVEY_GENRES } from '../lib/genreMap.js'
import { MODELS, MODEL_NAMES } from '../model/index.js'

const LEVELS = ['Never', 'Rarely', 'Sometimes', 'Very often']
const SOURCE_NAMES = { spotify: 'Spotify', lastfm: 'Last.fm', musicbrainz: 'MusicBrainz', none: 'not found' }

export default function UnderHood({ profile, model, onModel }) {
  return (
    <details className="card hood">
      <summary>Under the hood</summary>
      <p className="card-sub">
        Your listening turned into the survey's own scale. The team model uses the last column:
        1 if you'd have answered Sometimes or Very frequently, the same coding as the R analysis.
      </p>
      <table className="hood-table">
        <thead><tr><th>Genre</th><th>Share</th><th>As a survey answer</th><th title="The team model counts you as a listener if Sometimes or more">Listener?</th></tr></thead>
        <tbody>
          {SURVEY_GENRES.filter((g) => g !== 'Gospel' && g !== 'Latin').map((g) => ( // Gospel + Latin hidden app-wide (team decision)
            <tr key={g} className={profile.levels[g] ? '' : 'dim'}>
              <td>{g}</td>
              <td>{(profile.shares[g] * 100).toFixed(1)}%</td>
              <td><span className={`lvl lvl-${profile.levels[g]}`}>{LEVELS[profile.levels[g]]}</span></td>
              <td>{profile.levels[g] >= 2 ? '1' : '0'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="hood-row">
        <span>Model</span>
        <div className="range small">
          {Object.keys(MODELS).map((m) => (
            <button key={m} className={m === model ? 'on' : ''} onClick={() => onModel(m)}>{MODEL_NAMES[m] || m}</button>
          ))}
        </div>
      </div>

      <p className="hood-note">
        <b>Where genres came from:</b>{' '}
        {Object.entries(profile.sources).map(([src, n]) => `${SOURCE_NAMES[src] || src} ${n}`).join(' · ')}
      </p>
      {profile.untagged.length > 0 && (
        <p className="hood-note"><b>No genre info found for:</b> {profile.untagged.join(', ')}</p>
      )}
      {profile.unmatchedTags.length > 0 && (
        <p className="hood-note"><b>Tags with no rule yet</b> (add them in <code>src/lib/genreMap.js</code>): {profile.unmatchedTags.join(', ')}</p>
      )}
    </details>
  )
}
