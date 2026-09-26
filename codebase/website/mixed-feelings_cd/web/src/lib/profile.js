// Turns someone's Spotify top artists into a listening profile over the 16
// survey genres. That's the same "language" as the survey rows, so the two
// can be compared.
import { SURVEY_GENRES, mapArtist } from './genreMap.js'
import { GROUPS, GROUP_IDS, sumByGroup } from './groups.js'

/**
 * @param {{artists: {id,name,genres}[], tracks: {artistIds: string[]}[]}} listening
 * @returns profile: shares (0-1 per genre), levels (0-3 per genre, same scale as
 *          the survey's Never/Rarely/Sometimes/Very frequently), top5, etc.
 */
export function buildProfile(listening) {
  const { artists, tracks = [] } = listening
  const n = artists.length
  // How often each artist shows up in the top tracks gives a small boost
  const trackHits = {}
  for (const t of tracks) for (const id of t.artistIds) trackHits[id] = (trackHits[id] || 0) + 1

  const raw = Object.fromEntries(SURVEY_GENRES.map((g) => [g, 0]))
  const artistsByGenre = Object.fromEntries(SURVEY_GENRES.map((g) => [g, []]))
  const unmatched = new Set()
  const untagged = []
  const sources = {}

  artists.forEach((a, i) => {
    const rankWeight = 1 - i / (n + 10) // #1 artist = 1.0, #50 ~ 0.2
    const weight = rankWeight + 0.15 * Math.min(trackHits[a.id] || 0, 5)
    sources[a.genreSource || 'spotify'] = (sources[a.genreSource || 'spotify'] || 0) + 1
    const mix = mapArtist(a.genres, unmatched)
    if (!mix) { untagged.push(a.name); return }
    for (const [g, share] of Object.entries(mix)) {
      raw[g] += weight * share
      if (share >= 0.25) artistsByGenre[g].push(a.name)
    }
  })

  const total = Object.values(raw).reduce((s, v) => s + v, 0) || 1
  const shares = Object.fromEntries(SURVEY_GENRES.map((g) => [g, raw[g] / total]))
  const max = Math.max(...Object.values(shares)) || 1

  // Map shares to the survey's 0-3 frequency scale. Thresholds are relative to
  // your #1 genre, so a typical listener ends up with ~2-3 "Very frequently"
  // genres like the average survey respondent.
  const levels = Object.fromEntries(SURVEY_GENRES.map((g) => {
    const r = shares[g] / max
    return [g, r >= 0.45 ? 3 : r >= 0.15 ? 2 : shares[g] > 0.01 ? 1 : 0]
  }))

  const ranked = SURVEY_GENRES.filter((g) => shares[g] > 0).sort((a, b) => shares[b] - shares[a])
  const entropy = -Object.values(shares).filter((s) => s > 0).reduce((s, p) => s + p * Math.log(p), 0)

  // The 13 display groups (Hip hop+Rap, Pop+K pop, Rock+Metal merged) used by the genre charts and title
  const groupShares = sumByGroup(shares)
  const groupRanked = GROUP_IDS.filter((g) => groupShares[g] > 0).sort((a, b) => groupShares[b] - groupShares[a])
  const artistsByGroup = Object.fromEntries(GROUPS.map((g) => [g.id, [...new Set(g.members.flatMap((m) => artistsByGenre[m]))]]))
  const gEntropy = -Object.values(groupShares).filter((s) => s > 0).reduce((s, p) => s + p * Math.log(p), 0)

  return {
    groupShares,
    groupRanked,
    groupTop5: groupRanked.slice(0, 5),
    artistsByGroup,
    groupVariety: gEntropy / Math.log(GROUP_IDS.length),
    shares,
    levels,
    ranked,
    top5: ranked.slice(0, 5),
    artistsByGenre,
    variety: entropy / Math.log(SURVEY_GENRES.length), // 0 = one genre only, 1 = everything equally
    artistCount: n,
    matchedCount: n - untagged.length,
    untagged,
    unmatchedTags: [...unmatched].sort(),
    sources, // where each artist's genres came from: spotify / lastfm / musicbrainz / none
  }
}
