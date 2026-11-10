const TITLES: [number, string][] = [
  [1, 'Curious Coder'],
  [2, 'Intern'],
  [3, 'Junior Engineer'],
  [5, 'Engineer'],
  [7, 'Senior Engineer'],
  [9, 'Staff Engineer'],
  [12, 'Principal Engineer'],
  [15, 'Distinguished Architect']
]

/** Rank title for a given level. */
export function titleFor(level: number): string {
  let title = TITLES[0][1]
  for (const [min, t] of TITLES) if (level >= min) title = t
  return title
}

/** XP needed to go from level L to L+1. */
export const xpForNext = (level: number): number => 100 + 50 * (level - 1)

export interface LevelInfo {
  level: number
  title: string
  /** XP earned inside the current level */
  into: number
  /** XP required to finish the current level */
  need: number
}

export function levelInfo(totalXp: number): LevelInfo {
  let level = 1
  let rest = Math.max(0, totalXp)
  while (rest >= xpForNext(level)) {
    rest -= xpForNext(level)
    level++
  }
  return { level, title: titleFor(level), into: rest, need: xpForNext(level) }
}
