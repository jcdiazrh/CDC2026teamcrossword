import { useCallback, useEffect, useMemo, useState } from 'react'
import * as spotify from './lib/spotify.js'
import { buildProfile } from './lib/profile.js'
import { enrichGenres } from './lib/genreSources.js'
import Landing from './components/Landing.jsx'
import Loading from './components/Loading.jsx'
import Results from './components/Results.jsx'

// DEV ONLY: ?mock=metal|pop|mixed skips Spotify (see src/dev/mockListening.js)
const mockKind = import.meta.env.DEV ? new URLSearchParams(window.location.search).get('mock') : null

export default function App() {
  const [phase, setPhase] = useState('boot') // boot | landing | loading | results
  const [error, setError] = useState(null)
  const [timeRange, setTimeRange] = useState('medium_term')
  const [listening, setListening] = useState(null)
  const [loadingMsg, setLoadingMsg] = useState(null)

  const load = useCallback(async (range) => {
    setPhase('loading')
    setLoadingMsg(null)
    setError(null)
    try {
      const started = Date.now()
      let data
      if (mockKind) {
        const { mockListening } = await import('./dev/mockListening.js')
        data = mockListening(mockKind)
      } else {
        data = await spotify.fetchListening(range)
      }
      // Spotify's artist genres are deprecated and often empty: fill them in
      data = { ...data, artists: await enrichGenres(data.artists, setLoadingMsg) }
      setLoadingMsg(null)
      // Let the loading animation breathe for a moment. It's part of the fun.
      await new Promise((r) => setTimeout(r, Math.max(0, 1600 - (Date.now() - started))))
      await document.fonts?.ready // charts draw on canvas, so wait for the fonts
      setListening(data)
      setPhase('results')
    } catch (e) {
      if (e.auth) spotify.logout()
      setError(e.message)
      setPhase('landing')
    }
  }, [])

  useEffect(() => {
    (async () => {
      if (mockKind) return load(timeRange)
      try {
        await spotify.handleRedirect()
      } catch (e) {
        setError(e.message)
      }
      if (spotify.getToken()) load(timeRange)
      else setPhase('landing')
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const profile = useMemo(() => (listening ? buildProfile(listening) : null), [listening])

  const changeRange = (range) => {
    setTimeRange(range)
    load(range)
  }

  const logout = () => {
    spotify.logout()
    setListening(null)
    setPhase('landing')
  }

  return (
    <div className="app">
      <div className="grain" aria-hidden="true" />
      {phase === 'boot' && null}
      {phase === 'landing' && <Landing error={error} onLogin={spotify.login} ready={spotify.hasClientId()} />}
      {phase === 'loading' && <Loading message={loadingMsg} />}
      {phase === 'results' && profile && (
        <Results
          name={listening.name}
          userId={listening.userId}
          profile={profile}
          timeRange={timeRange}
          onTimeRange={changeRange}
          onLogout={logout}
        />
      )}
    </div>
  )
}
