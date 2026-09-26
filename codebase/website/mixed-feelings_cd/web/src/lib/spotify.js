// Spotify login (Authorization Code + PKCE) done entirely in the browser.
// No server or client secret needed. Only the Client ID lives in the app.
//
// Spotify rules to know (as of Feb 2026):
//  * Dev-mode apps allow 5 users max, added by hand in the Spotify dashboard.
//  * The app owner needs Spotify Premium.
//  * Redirect URIs must be HTTPS, or http://127.0.0.1 for local dev ("localhost" is rejected).

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID
const SCOPES = 'user-top-read'
const AUTH_URL = 'https://accounts.spotify.com/authorize'
const TOKEN_URL = 'https://accounts.spotify.com/api/token'
const API = 'https://api.spotify.com/v1'
const TOKEN_KEY = 'vibecheck.token'
const VERIFIER_KEY = 'vibecheck.verifier'

export const TIME_RANGES = [
  { id: 'short_term', label: '4 weeks' },
  { id: 'medium_term', label: '6 months' },
  { id: 'long_term', label: 'All time' },
]

export const hasClientId = () => Boolean(CLIENT_ID)

export function redirectUri() {
  return window.location.origin + import.meta.env.BASE_URL
}

const store = {
  get(k) { try { return localStorage.getItem(k) } catch { return null } },
  set(k, v) { try { localStorage.setItem(k, v) } catch { /* private mode */ } },
  del(k) { try { localStorage.removeItem(k) } catch { /* private mode */ } },
}

function randomString(len = 64) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = crypto.getRandomValues(new Uint8Array(len))
  return Array.from(bytes, (b) => chars[b % chars.length]).join('')
}

async function challengeFrom(verifier) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

export async function login() {
  const verifier = randomString()
  store.set(VERIFIER_KEY, verifier)
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: redirectUri(),
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: await challengeFrom(verifier),
  })
  window.location.href = `${AUTH_URL}?${params}`
}

export function logout() {
  store.del(TOKEN_KEY)
  store.del(VERIFIER_KEY)
}

/** If we just came back from Spotify with ?code=..., swap it for a token. */
export async function handleRedirect() {
  const url = new URL(window.location.href)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')
  if (!code && !error) return
  window.history.replaceState({}, '', url.pathname) // clean the URL
  if (error) throw new Error(error === 'access_denied' ? 'You cancelled the Spotify login.' : `Spotify said: ${error}`)

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri(),
      code_verifier: store.get(VERIFIER_KEY) || '',
    }),
  })
  if (!res.ok) throw new Error('Could not finish the Spotify login. Try again.')
  const t = await res.json()
  store.set(TOKEN_KEY, JSON.stringify({ access: t.access_token, expires: Date.now() + t.expires_in * 1000 }))
  store.del(VERIFIER_KEY)
}

export function getToken() {
  try {
    const t = JSON.parse(store.get(TOKEN_KEY))
    return t && t.expires > Date.now() + 30_000 ? t.access : null
  } catch { return null }
}

async function api(path) {
  const token = getToken()
  if (!token) throw Object.assign(new Error('Session expired. Log in again.'), { auth: true })
  const res = await fetch(API + path, { headers: { Authorization: `Bearer ${token}` } })
  if (res.status === 401) { logout(); throw Object.assign(new Error('Session expired. Log in again.'), { auth: true }) }
  if (res.status === 403) throw Object.assign(new Error(
    "Spotify blocked this account. While the app is in development mode, only accounts added in the Spotify dashboard (max 5) can use it."), { auth: true })
  if (!res.ok) throw new Error(`Spotify error ${res.status}`)
  return res.json()
}

/** Everything the app needs, in one shape (the dev mock returns the same shape). */
export async function fetchListening(timeRange = 'medium_term') {
  const [me, artists, tracks] = await Promise.all([
    api('/me'),
    api(`/me/top/artists?time_range=${timeRange}&limit=50`),
    api(`/me/top/tracks?time_range=${timeRange}&limit=50`),
  ])
  return {
    name: me.display_name || 'you',
    userId: me.id,
    artists: artists.items.map((a) => ({
      id: a.id, name: a.name, genres: a.genres || [], image: a.images?.[a.images.length - 1]?.url,
    })),
    tracks: tracks.items.map((t) => ({ name: t.name, artistIds: t.artists.map((a) => a.id) })),
  }
}
