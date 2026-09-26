// Maps Spotify's micro-genre tags ("atl hip hop", "bedroom pop", "latin trap"...)
// onto the 16 broad genres used in the MxMH survey.
//
// Each rule sends a tag to its NEAREST survey genre (weight 1) and, where it
// clearly straddles two, to a NEIGHBOURING genre too (weight 0.5).
// Rules are checked top to bottom and the FIRST match wins, so specific phrases
// ("latin trap", "jazz rap") must sit above broad words ("trap", "jazz").
//
// To improve the mapping: add a rule. Tags nothing matched are listed in the
// app's "under the hood" panel so you can see what to add.

export const SURVEY_GENRES = [
  'Classical', 'Country', 'EDM', 'Folk', 'Gospel', 'Hip hop', 'Jazz', 'K pop',
  'Latin', 'Lofi', 'Metal', 'Pop', 'R&B', 'Rap', 'Rock', 'Video game music',
]

const r = (pattern, weights) => ({ re: new RegExp(pattern, 'i'), weights })

export const RULES = [
  // ---- cross-over phrases first -------------------------------------------
  r('k-?rap|korean (hip hop|rap)', { 'K pop': 1, Rap: 0.5 }),
  r('k-?pop|korean|k-?indie|k-?rock|k-?r&b|kpop|\\bidol\\b', { 'K pop': 1 }),
  r('latin (trap|hip hop|rap)|trap latino|urbano latino|reggaeton|dembow|rap (latin|mexican|chileno|argentin|espa|colombian|dominican|cubano)', { Latin: 1, Rap: 0.5 }),
  r('latin (pop|rock|indie|alternative)', { Latin: 1, Pop: 0.5 }),
  r('jazz rap|jazz hip hop', { 'Hip hop': 1, Jazz: 0.5 }),
  r('lo-?fi|lofi|chillhop|chill ?beats|study beats|jazz beats|lo-fi beats', { Lofi: 1 }),
  r('video game|vgm|chiptune|8-?bit|bitpop|game (music|soundtrack)|nintendocore', { 'Video game music': 1 }),
  r('anime|j-?rock|vocaloid|touhou|doujin', { 'Video game music': 1, Pop: 0.5 }),
  r('trip hop', { EDM: 1, 'Hip hop': 0.5 }),
  r('rap metal|nu metal|rap rock', { Metal: 1, Rap: 0.5 }),
  r('christian (hip hop|rap)', { Gospel: 1, 'Hip hop': 0.5 }),
  r('christian (rock|metal|punk)', { Rock: 1, Gospel: 0.5 }),
  r('dance ?pop|electropop|hyperpop|synth-?pop|electro ?pop', { Pop: 1, EDM: 0.5 }),
  r('country (rap|hip hop)|country trap|hick hop', { Country: 1, Rap: 0.5 }),
  r('country rock|southern rock', { Country: 1, Rock: 0.5 }),
  r('folk rock|folk punk', { Folk: 1, Rock: 0.5 }),
  r('folk pop|indie folk', { Folk: 1, Pop: 0.5 }),
  r('pop punk|pop rock|power pop', { Rock: 1, Pop: 0.5 }),
  r('hardcore punk|post-hardcore|melodic hardcore|screamo', { Rock: 1, Metal: 0.5 }),
  r('bossa nova|latin jazz|afro-cuban', { Jazz: 1, Latin: 0.5 }),
  r('neo soul|neo-soul|alternative r&b', { 'R&B': 1, 'Hip hop': 0.5 }),
  r('(indie|dream|art|chamber|baroque|bedroom|alt|alternative) pop', { Pop: 1, Rock: 0.5 }),
  r('blues rock|punk blues', { Rock: 1, Jazz: 0.5 }),
  r('nightcore|glitchcore|digicore', { EDM: 1, Pop: 0.5 }),
  r('slowcore|sadcore|permanent wave', { Rock: 1 }),
  r('escape room', { 'R&B': 1, Pop: 0.5 }),
  r('reggae|dancehall|\\bska\\b|\\bdub\\b|soca|calypso', { Latin: 1, 'Hip hop': 0.5 }),
  r('pop rap|melodic rap', { Rap: 1, Pop: 0.5 }),
  r('funk carioca|funk brasileiro|brazilian funk|baile funk', { Latin: 1, EDM: 0.5 }),

  // ---- one genre each ------------------------------------------------------
  r('metal|metalcore|deathcore|mathcore|djent|grindcore|doom|sludge|thrash|black ?gaze', { Metal: 1 }),
  r('\\brap\\b|trap|drill|grime|phonk|horrorcore|plugg|\\brage\\b', { Rap: 1 }),
  r('hip ?-?hop|boom bap|turntablism|g-?funk|gangster', { 'Hip hop': 1 }),
  r('r&b|rnb|\\bsoul\\b|motown|quiet storm|new jack swing|funk|disco', { 'R&B': 1 }),
  r('gospel|worship|christian|\\bccm\\b|praise|spirituals', { Gospel: 1 }),
  r('country|bluegrass|honky|americana|red dirt|outlaw|nashville|western', { Country: 1 }),
  r('latin|salsa|bachata|cumbia|merengue|mexican|corrido|banda|mariachi|norteñ|nortena|sertanejo|\\bmpb\\b|samba|tango|flamenco|bolero|tropical|urbano|ranchera|sierreño|vallenato|brazil', { Latin: 1 }),
  r('jazz|bebop|swing|big band|dixieland|ragtime|blues', { Jazz: 1 }),
  r('classical|baroque|orchestra|opera|symphon|chamber|romantic era|early music|choral|choir|neoclassical|compositional|minimalism|string quartet|soundtrack|\\bscore\\b|film music|cinematic', { Classical: 1 }),
  r('edm|house|techno|trance|dubstep|drum and bass|dnb|jungle|electro|electronic|electronica|big room|future bass|uk garage|future garage|speed garage|hardstyle|bass music|brostep|\\bidm\\b|synthwave|vaporwave|breakbeat|dance|rave|club|eurobeat|gabber', { EDM: 1 }),
  r('folk|singer-songwriter|acoustic|stomp and holler|celtic|sea shanty|traditional', { Folk: 1 }),
  r('rock|punk|grunge|emo|shoegaze|post-|britpop|new wave|math|psych|garage|alternative|indie|surf|stoner|goth|dream', { Rock: 1 }),
  r('pop|boy band|girl group|teen|j-?pop|c-?pop|mandopop|cantopop|opm|bubblegum|schlager|chanson', { Pop: 1 }),

  // ---- genres the survey doesn't have: send to the nearest neighbours -------
  r('afro|amapiano|highlife|bongo', { 'R&B': 1, Pop: 0.5 }),
  r('ambient|new age|meditation|sleep|drone|chill', { Lofi: 1, Classical: 0.5 }),
  r('musical|broadway|show tunes|cabaret', { Pop: 1, Classical: 0.5 }),
  r('singer|crooner|lounge|adult standards|easy listening', { Jazz: 1, Pop: 0.5 }),
  r('children|kids|nursery|lullab', { Pop: 1 }),
]

/** One Spotify tag -> { genre: weight } (or null if nothing matched). */
export function mapTag(tag) {
  const t = tag.toLowerCase().trim()
  for (const rule of RULES) if (rule.re.test(t)) return rule.weights
  // Nearest-neighbour fallback: try each word of the tag on its own
  const merged = {}
  for (const word of t.split(/[\s-]+/)) {
    if (word.length < 3) continue
    for (const rule of RULES) {
      if (rule.re.test(word)) {
        for (const [g, w] of Object.entries(rule.weights)) merged[g] = Math.max(merged[g] || 0, w)
        break
      }
    }
  }
  return Object.keys(merged).length ? merged : null
}

/**
 * One artist's list of tags -> normalised { genre: share } summing to 1.
 * Tags that match nothing borrow the artist's other genres (their nearest
 * neighbours); only an artist with NO matchable tags returns null.
 */
export function mapArtist(tags, unmatched) {
  const acc = {}
  for (const tag of tags) {
    const w = mapTag(tag)
    if (!w) { unmatched?.add(tag); continue }
    for (const [g, v] of Object.entries(w)) acc[g] = (acc[g] || 0) + v
  }
  const total = Object.values(acc).reduce((a, b) => a + b, 0)
  if (!total) return null
  for (const g in acc) acc[g] /= total
  return acc
}
