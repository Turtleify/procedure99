import type { DayRecord, Streak } from '../../../shared/types'
import { addDays, daysBetween } from '../../../shared/dates'

export const MAX_FREEZES = 2

export interface ReconcileResult {
  streak: Streak
  frozenDays: string[]
  lost: number // streak length that was lost (0 if none)
}

/**
 * Called on launch and at midnight. If whole days were missed since the last
 * goal day, spend freezes to cover them; otherwise the streak resets.
 */
export function reconcileStreak(streak: Streak, today: string): ReconcileResult {
  const s = { ...streak }
  if (!s.lastGoalDate || s.count === 0) return { streak: s, frozenDays: [], lost: 0 }
  const gap = daysBetween(s.lastGoalDate, today)
  const missed = gap - 1 // days strictly between lastGoalDate and today
  if (missed <= 0) return { streak: s, frozenDays: [], lost: 0 }
  if (s.freezes >= missed) {
    const frozenDays: string[] = []
    for (let i = 1; i <= missed; i++) frozenDays.push(addDays(s.lastGoalDate, i))
    s.freezes -= missed
    s.lastGoalDate = addDays(today, -1)
    return { streak: s, frozenDays, lost: 0 }
  }
  const lost = s.count
  s.count = 0
  return { streak: s, frozenDays: [], lost }
}

/** Called the moment today's goal is hit. */
export function registerGoal(streak: Streak, today: string): { streak: Streak; earnedFreeze: boolean } {
  const s = { ...streak }
  if (s.lastGoalDate === today) return { streak: s, earnedFreeze: false }
  s.count = s.lastGoalDate === addDays(today, -1) ? s.count + 1 : 1
  s.lastGoalDate = today
  s.best = Math.max(s.best, s.count)
  let earnedFreeze = false
  if (s.count % 7 === 0 && s.freezes < MAX_FREEZES) {
    s.freezes++
    earnedFreeze = true
  }
  return { streak: s, earnedFreeze }
}

export function markFrozen(days: Record<string, DayRecord>, frozenDays: string[]): Record<string, DayRecord> {
  const next = { ...days }
  for (const d of frozenDays) next[d] = { ...(next[d] ?? { xp: 0, goalMet: false }), frozen: true }
  return next
}
