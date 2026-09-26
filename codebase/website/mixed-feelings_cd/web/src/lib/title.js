import { leadMember } from './groups.js'

// "Moody Metalhead"-style titles. The noun comes from your #1 genre; the adjective
// from your #2 genre or how varied your taste is. Never from the mental-health results.

const NOUNS = {
  Classical: ['Maestro', 'Virtuoso', 'Conductor', 'Concerto Kid'],
  Country: ['Cowpoke', 'Honky-Tonker', 'Backroad Bard', 'Rhinestone Rider'],
  EDM: ['Raver', 'Bass Goblin', 'Drop Chaser', 'Strobe Child'],
  Folk: ['Wanderer', 'Campfire Poet', 'Banjo Soul', 'Trail Troubadour'],
  Gospel: ['Choir Kid', 'Hallelujah Hitter', 'Soul Saint'],
  'Hip hop': ['Head Nodder', 'Beat Digger', 'Cypher Kid', 'Crate Digger'],
  Jazz: ['Cool Cat', 'Swing Kid', 'Night Owl', 'Improviser'],
  'K pop': ['Stan', 'Bias Wrecker', 'Lightstick Legend', 'Comeback Chaser'],
  Latin: ['Perreo Prodigy', 'Salsa Soul', 'Fiesta Starter', 'Dance-Floor Dynamo'],
  Lofi: ['Daydreamer', 'Study Ghost', 'Rainy-Window Kid', 'Cloud Watcher'],
  Metal: ['Metalhead', 'Headbanger', 'Mosh Monarch', 'Riff Wizard'],
  Pop: ['Pop Star', 'Chart Chaser', 'Hook Hunter', 'Main Character'],
  'R&B': ['Slow Jammer', 'Velvet Voice', 'Crooner', 'Groove Keeper'],
  Rap: ['Bar Collector', 'Verse Villain', 'Punchline Poet', 'Mic Menace'],
  Rock: ['Riff Raider', 'Rock Goblin', 'Air Guitarist', 'Amp Crusher'],
  'Video game music': ['Boss Fighter', 'Side Quester', 'Speedrunner', 'Pixel Knight'],
}

const ADJECTIVES = {
  Classical: ['Refined', 'Operatic', 'Grand'],
  Country: ['Dusty', 'Two-Stepping', 'Rhinestoned'],
  EDM: ['Electric', 'Neon', 'Supercharged'],
  Folk: ['Earthy', 'Wandering', 'Cozy'],
  Gospel: ['Soulful', 'Uplifted', 'Heavenly'],
  'Hip hop': ['Smooth', 'Boom-Bap', 'Laid-Back'],
  Jazz: ['Jazzy', 'Smoky', 'Velvet'],
  'K pop': ['Sparkly', 'Choreographed', 'Glittering'],
  Latin: ['Spicy', 'Sun-Kissed', 'Fiery'],
  Lofi: ['Sleepy', 'Dreamy', 'Hazy'],
  Metal: ['Moody', 'Thunderous', 'Spiked'],
  Pop: ['Glossy', 'Bubblegum', 'Catchy'],
  'R&B': ['Silky', 'Late-Night', 'Buttery'],
  Rap: ['Hard-Hitting', 'Quick-Witted', 'Unfiltered'],
  Rock: ['Loud', 'Scrappy', 'Amped'],
  'Video game music': ['Pixelated', 'Level-99', 'Respawning'],
}
const WIDE = ['Genre-Hopping', 'Omnivorous', 'Chaotic', 'Shuffle-Mode']
const NARROW = ['Devoted', 'Die-Hard', 'Certified', 'Card-Carrying']

// Small seeded RNG so the same person gets the same title until they reroll
function rng(seedStr) {
  let h = 2166136261
  for (const c of seedStr) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}
const pick = (arr, rand) => arr[Math.floor(rand() * arr.length)]

export function makeTitle(profile, seed = '') {
  // Rank by the 13 display groups (so the title matches the genre chart), then use
  // the bigger member for flavour: "Rock & Metal" with more Metal -> Metalhead
  const [g1, g2] = profile.groupRanked
  if (!g1) return { adjective: 'Mysterious', noun: 'Listener' }
  const first = leadMember(g1, profile.shares)
  const second = g2 ? leadMember(g2, profile.shares) : null
  const rand = rng(seed + first + (second || ''))
  let pool = second ? [...ADJECTIVES[second]] : []
  if (profile.groupVariety > 0.62) pool = pool.concat(WIDE, WIDE)
  if (profile.groupShares[g1] > 0.55 || !second) pool = pool.concat(NARROW, NARROW)
  if (!pool.length) pool = ADJECTIVES[first]
  return { adjective: pick(pool, rand), noun: pick(NOUNS[first], rand) }
}
