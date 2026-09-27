// Spotify "Top 100" playlist for each genre shown in the app. Direct playlist links open reliably
// (in the Spotify app, or the web player without logging in); search-page links came up blank.
const PLAYLISTS = {
  'Classical': '5qUesesbOQWpC7ybZiC0VO',        // Top 100 Classical Music
  'Country': '5tA2x3J6yAaJpa7mHGvhmB',          // Top 100 Country Tracks on Spotify
  'EDM': '03SoxAdQqvqNMXZZfj7M6M',              // EDM Songs Everyone Knows: Top 100 Most Streamed
  'Folk': '6LdOBfcxIvWHuiycjzKMfV',             // Folk Top 100
  'Hip hop & Rap': '06KmJWiQhL0XiV6QQAHsmw',    // Top 100 Hip-Hop Tracks on Spotify
  'Jazz': '5rdgRwdMskt1IJKjNf0VWQ',             // Jazz Top 100: Most Popular on Spotify
  'Lofi': '7ysFXoD88gj8VEpxitqSAn',             // LOFI Top 100 All Time
  'Pop & K-pop': '3ZgmfR6lsnCwdffZUan8EA',      // Top 100 Pop Tracks on Spotify
  'R&B': '76h0bH2KJhiBuLZqfvPp3K',              // Top 100 R&B Tracks on Spotify
  'Rock & Metal': '3qu74M0PqlkSV76f98aqTd',     // Top 100 Rock Tracks on Spotify
  'Video game music': '2A8OaoizDchyRgMovcNccm', // Top 100 Video Game Soundtracks
}

export function spotifyTop100(genre) {
  const id = PLAYLISTS[genre]
  if (id) return `https://open.spotify.com/playlist/${id}`
  return `https://open.spotify.com/search/${encodeURIComponent(`${genre.toLowerCase()} top 100`)}/playlists`
}
