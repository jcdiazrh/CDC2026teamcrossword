import { SURVEY_GENRES } from '../lib/genreMap.js'
import { MODELS } from '../model/index.js'

const LEVELS = ['Never', 'Rarely', 'Sometimes', 'Very often']
const SOURCE_NAMES = { spotify: 'Spotify', lastfm: 'Last.fm', musicbrainz: 'MusicBrainz', none: 'not found' }
const MODEL_NAMES = { knn: 'Listeners like you (k-nearest)', linear: 'Linear model (sample)' }

export default function UnderHood({ profile, model, onModel }) {
  return (
    <details className="card hood">
      <summary>Under the hood</summary>
      <p className="card-sub">
        Your listening turned into the survey's own scale. This row is what gets compared with the {''}
        survey respondents.
      </p>
      <table className="hood-table">
        <thead><tr><th>Genre</th><th>Share</th><th>As a survey answer</th></tr></thead>
        <tbody>
          {SURVEY_GENRES.map((g) => (
            <tr key={g} className={profile.levels[g] ? '' : 'dim'}>
              <td>{g}</td>
              <td>{(profile.shares[g] * 100).toFixed(1)}%</td>
              <td><span className={`lvl lvl-${profile.levels[g]}`}>{LEVELS[profile.levels[g]]}</span></td>
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
