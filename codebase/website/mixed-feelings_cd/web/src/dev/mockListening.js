// DEV ONLY: fake Spotify data so teammates can work on the UI without using
// one of the 5 Spotify dev-mode slots. Open http://127.0.0.1:5173/?mock=metal
// (or ?mock=pop, ?mock=mixed, ?mock=nogenres). Never included in the production build.

const A = (name, genres) => ({ id: name.toLowerCase().replace(/\W+/g, '-'), name, genres })

const SETS = {
  metal: [
    A('Sleep Token', ['alternative metal', 'progressive metalcore']),
    A('Spiritbox', ['metalcore', 'progressive metalcore']),
    A('Deftones', ['alternative metal', 'nu metal', 'rock']),
    A('Bring Me The Horizon', ['metalcore', 'alternative metal']),
    A('Gojira', ['progressive metal', 'groove metal']),
    A('Radiohead', ['art rock', 'alternative rock', 'permanent wave']),
    A('Phoebe Bridgers', ['indie pop', 'indie folk', 'singer-songwriter']),
    A('Toby Fox', ['video game music']),
    A('Nujabes', ['jazz rap', 'lo-fi beats']),
    A('Mitski', ['indie pop', 'art pop']),
    A('Slipknot', ['nu metal', 'alternative metal']),
    A('Tool', ['progressive metal', 'alternative metal']),
    A('Mystery Artist', []),
    A('Kendrick Lamar', ['hip hop', 'west coast hip hop', 'rap']),
    A('Muse', ['modern rock', 'permanent wave']),
  ],
  pop: [
    A('Sabrina Carpenter', ['pop']),
    A('Chappell Roan', ['pop', 'indie pop']),
    A('Olivia Rodrigo', ['pop', 'pop rock']),
    A('Taylor Swift', ['pop']),
    A('SZA', ['r&b', 'alternative r&b']),
    A('Bad Bunny', ['reggaeton', 'latin trap', 'trap latino']),
    A('NewJeans', ['k-pop', 'k-pop girl group']),
    A('Charli xcx', ['hyperpop', 'dance pop']),
    A('Frank Ocean', ['neo soul', 'alternative r&b']),
    A('Doechii', ['rap', 'hip hop']),
    A('Tyler, The Creator', ['hip hop', 'rap']),
    A('Fred again..', ['house', 'uk garage']),
  ],
  mixed: [
    A('Bach Collegium', ['baroque', 'classical']),
    A('Zach Bryan', ['country', 'red dirt']),
    A('Fred again..', ['house', 'uk garage']),
    A('Noah Kahan', ['folk pop', 'stomp and holler']),
    A('Kirk Franklin', ['gospel', 'worship']),
    A('Kendrick Lamar', ['hip hop', 'rap']),
    A('Kamasi Washington', ['jazz', 'spiritual jazz']),
    A('Stray Kids', ['k-pop']),
    A('Peso Pluma', ['corrido', 'sierreño']),
    A('Metallica', ['thrash metal', 'metal']),
    A('Dua Lipa', ['dance pop', 'pop']),
    A('The Strokes', ['garage rock', 'modern rock']),
  ],
}

export function mockListening(kind = 'metal') {
  // ?mock=nogenres simulates Spotify's deprecated (empty) genres field
  const artists = kind === 'nogenres'
    ? SETS.metal.map((a) => ({ ...a, genres: [] }))
    : SETS[kind] || SETS.metal
  return {
    name: 'Demo listener',
    userId: 'demo-' + kind,
    artists,
    tracks: artists.slice(0, 8).map((a) => ({ name: 'Track', artistIds: [a.id] })),
  }
}
