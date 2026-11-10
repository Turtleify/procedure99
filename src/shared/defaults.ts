import type { AppState } from './types'
import { dateStr } from './dates'

/** Daily XP goal options (Settings → Daily goal). */
export const DAILY_GOALS = [30, 70, 100, 200] as const

/** Older saves may hold a goal that's no longer offered: round up to the nearest option. */
export function normalizeGoal(goal: number | undefined): number {
  if (!goal || !Number.isFinite(goal)) return DAILY_GOALS[0]
  return DAILY_GOALS.find((g) => g >= goal) ?? DAILY_GOALS[DAILY_GOALS.length - 1]
}

export function defaultState(): AppState {
  return {
    version: 1,
    createdAt: dateStr(),
    xp: 0,
    completed: {},
    srs: {},
    streak: { count: 0, best: 0, lastGoalDate: null, freezes: 1 },
    days: {},
    quests: null,
    daily: null,
    arena: { wins: 0, played: 0, correct: 0 },
    stats: { reviews: 0, dailyWins: 0, perfects: 0, labs: 0, early: false, night: false },
    toolsViewed: {},
    achievements: {},
    notes: {},
    settings: {
      dailyGoal: 30,
      reminderTime: '19:00',
      startupMode: 'tray',
      dangerAlert: true,
      closeToTray: true,
      sounds: true,
      hoverSounds: true,
      musicVolume: 0.3,
      musicMuted: false
    }
  }
}

/** Fill in any fields missing from an older/partial save. */
export function hydrate(loaded: Partial<AppState> | null | undefined): AppState {
  const base = defaultState()
  if (!loaded) return base
  return {
    ...base,
    ...loaded,
    streak: { ...base.streak, ...loaded.streak },
    arena: { ...base.arena, ...loaded.arena },
    stats: { ...base.stats, ...loaded.stats },
    settings: { ...base.settings, ...loaded.settings, dailyGoal: normalizeGoal(loaded.settings?.dailyGoal ?? base.settings.dailyGoal) }
  }
}
