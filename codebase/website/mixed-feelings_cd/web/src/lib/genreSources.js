// Spotify has deprecated the artist `genres` field, and for many apps it now
// comes back empty. This file fills in the gaps from other free music databases:
//
//   1. Spotify genres, when Spotify still sends them
//   2. Last.fm tags: fast and rich. Needs a free key in VITE_LASTFM_API_KEY
//      (https://www.last.fm/api/account/create takes one minute)
//   3. MusicBrainz tags: no key, but limited to 1 request per second, so we
//      only look up your top 15 artists that way
//
// Results are cached in the browser so switching time ranges is instant.

const LASTFM_KEY = import.meta.env.VITE_LASTFM_API_KEY
const CACHE_KEY = 'mixedfeelings.genres.v1'
const MB_LIMIT = 15
// Tags that say nothing about genre
const JUNK = /^(seen live|favou?rites?|awesome|love|beautiful|amazing|cool|best|my |under \d|\d+ of \d+|spotify|albums i own|female vocalists?|male vocalists?|vocalists?|american|british|english|canadian|australian|usa|uk|\d0s|\d{4}s?)$/i

export const hasLastfmKey = () => Boolean(LASTFM_KEY)

function loadCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || {} } catch { return {} }
}
function saveCache(cache) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)) } catch { /* storage off */ }
}

const cleanTags = (tags, minCount = 0) => tags
  .filter((t) => t && t.name && (t.count ?? 100) >= minCount && !JUNK.test(t.name.trim()))
  .slice(0, 6)
  .map((t) => t.name.toLowerCase().trim())

async function lastfmTags(name) {
  const params = new URLSearchParams({
    method: 'artist.gettoptags', artist: name, autocorrect: '1', api_key: LASTFM_KEY, format: 'json',
  })
  const res = await fetch(`https://ws.audioscrobbler.com/2.0/?${params}`)
  if (!res.ok) return []
  const json = await res.json()
  const tags = json?.toptags?.tag
  return Array.isArray(tags) ? cleanTags(tags, 10) : []
}

async function musicbrainzTags(name) {
  const q = encodeURIComponent(`artist:"${name.replace(/"/g, '')}"`)
  const res = await fetch(`https://musicbrainz.org/ws/2/artist?query=${q}&limit=1&fmt=json`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) return []
  const json = await res.json()
  const a = json?.artists?.[0]
  if (!a || (a.score ?? 100) < 90) return []
  const tags = [...(a.genres || []), ...(a.tags || [])].sort((x, y) => (y.count || 0) - (x.count || 0))
  return cleanTags(tags)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * Returns a copy of `artists` with genres filled in where possible, each
 * marked with genreSource: 'spotify' | 'lastfm' | 'musicbrainz' | 'none'.
 */
export async function enrichGenres(artists, onProgress = () => {}) {
  const cache = loadCache()
  const out = artists.map((a) => {
    if (a.genres?.length) return { ...a, genreSource: 'spotify' }
    const hit = cache[a.id]
    if (hit?.genres?.length) return { ...a, genres: hit.genres, genreSource: hit.source }
    return { ...a, genres: [], genreSource: 'none' }
  })

  const missing = out.filter((a) => a.genreSource === 'none')
  if (!missing.length) return out

  if (LASTFM_KEY) {
    onProgress(`Looking up genres for ${missing.length} artists on Last.fm…`)
    let next = 0
    const worker = async () => {
      while (next < missing.length) {
        const a = missing[next++]
        try {
          const tags = await lastfmTags(a.name)
          if (tags.length) Object.assign(a, { genres: tags, genreSource: 'lastfm' })
        } catch { /* skip this artist */ }
      }
    }
    await Promise.all(Array.from({ length: 6 }, worker))
  } else {
    const batch = missing.slice(0, MB_LIMIT)
    for (let i = 0; i < batch.length; i++) {
      onProgress(`Looking up genres on MusicBrainz (${i + 1}/${batch.length})…`)
      try {
        const tags = await musicbrainzTags(batch[i].name)
        if (tags.length) Object.assign(batch[i], { genres: tags, genreSource: 'musicbrainz' })
      } catch { /* skip this artist */ }
      if (i < batch.length - 1) await sleep(1100) // MusicBrainz allows 1 request/second
    }
  }

  for (const a of out) {
    if (a.genreSource === 'lastfm' || a.genreSource === 'musicbrainz') cache[a.id] = { genres: a.genres, source: a.genreSource }
  }
  saveCache(cache)
  return out
}
