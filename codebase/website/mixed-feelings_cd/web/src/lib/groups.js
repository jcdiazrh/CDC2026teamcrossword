// Display groups: the survey's 16 genres shown as 13 categories.
// Three close pairs are merged for the charts: Hip hop + Rap, Pop + K pop, Rock + Metal.
// (The models still use all 16 survey genres underneath.)

export const GROUPS = [
  { id: 'Classical', members: ['Classical'] },
  { id: 'Country', members: ['Country'] },
  { id: 'EDM', members: ['EDM'] },
  { id: 'Folk', members: ['Folk'] },
  { id: 'Gospel', members: ['Gospel'] },
  { id: 'Hip hop & Rap', members: ['Hip hop', 'Rap'] },
  { id: 'Jazz', members: ['Jazz'] },
  { id: 'Latin', members: ['Latin'] },
  { id: 'Lofi', members: ['Lofi'] },
  { id: 'Pop & K-pop', members: ['Pop', 'K pop'] },
  { id: 'R&B', members: ['R&B'] },
  { id: 'Rock & Metal', members: ['Rock', 'Metal'] },
  { id: 'Video game music', members: ['Video game music'] },
]

export const GROUP_IDS = GROUPS.map((g) => g.id)
export const GROUP_OF = Object.fromEntries(GROUPS.flatMap((g) => g.members.map((m) => [m, g.id])))

/** { genre: value } over 16 genres -> { group: summed value } over 13 groups */
export function sumByGroup(byGenre) {
  return Object.fromEntries(GROUPS.map((g) => [g.id, g.members.reduce((s, m) => s + (byGenre[m] || 0), 0)]))
}

/** The member genre with the biggest value (e.g. Metal vs Rock inside "Rock & Metal") */
export function leadMember(groupId, byGenre) {
  const g = GROUPS.find((x) => x.id === groupId)
  return g.members.reduce((best, m) => ((byGenre[m] || 0) > (byGenre[best] || 0) ? m : best), g.members[0])
}
