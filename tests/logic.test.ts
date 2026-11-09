import { describe, expect, it } from 'vitest'
import type { AppState, Streak } from '../src/shared/types'
import { addDays, daysBetween } from '../src/shared/dates'
import { defaultState } from '../src/shared/defaults'
import { levelInfo, xpForNext } from '../src/renderer/src/lib/levels'
import { answerCard, introduceCard, dueIds } from '../src/renderer/src/lib/srs'
import { reconcileStreak, registerGoal } from '../src/renderer/src/lib/streak'
import { allQuestsDone, applyQuestEvent, generateQuests } from '../src/renderer/src/lib/quests'
import { decideReminder, dangerMinutes } from '../src/main/reminders'

const T = '2026-11-08'
const streak = (p: Partial<Streak>): Streak => ({ count: 0, best: 0, lastGoalDate: null, freezes: 0, ...p })

describe('dates', () => {
  it('handles month/year boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
    expect(daysBetween('2026-11-01', '2026-11-08')).toBe(7)
  })
})

describe('levels', () => {
  it('starts at level 1 and levels up at the thresholds', () => {
    expect(levelInfo(0).level).toBe(1)
    expect(levelInfo(xpForNext(1) - 1).level).toBe(1)
    expect(levelInfo(xpForNext(1)).level).toBe(2)
    expect(levelInfo(100 + 150).level).toBe(3)
    expect(levelInfo(100 + 150).into).toBe(0)
  })
})

describe('srs', () => {
  it('introduces cards into box 2 when correct, box 1 when wrong', () => {
    expect(introduceCard(true, T)).toEqual({ box: 2, due: addDays(T, 2) })
    expect(introduceCard(false, T)).toEqual({ box: 1, due: addDays(T, 1) })
  })
  it('promotes on correct, resets on wrong, caps at box 6', () => {
    expect(answerCard({ box: 3, due: T }, true, T)).toEqual({ box: 4, due: addDays(T, 8) })
    expect(answerCard({ box: 5, due: T }, false, T)).toEqual({ box: 1, due: addDays(T, 1) })
    expect(answerCard({ box: 6, due: T }, true, T).box).toBe(6)
  })
  it('finds due cards', () => {
    expect(dueIds({ a: { box: 1, due: T }, b: { box: 2, due: addDays(T, 1) } }, T)).toEqual(['a'])
  })
})

describe('streak', () => {
  it('increments when yesterday was a goal day', () => {
    const r = registerGoal(streak({ count: 4, best: 4, lastGoalDate: addDays(T, -1) }), T)
    expect(r.streak.count).toBe(5)
    expect(r.streak.best).toBe(5)
  })
  it('restarts at 1 after a gap and is idempotent on the same day', () => {
    expect(registerGoal(streak({ count: 9, lastGoalDate: addDays(T, -3) }), T).streak.count).toBe(1)
    const s = streak({ count: 3, lastGoalDate: T })
    expect(registerGoal(s, T).streak.count).toBe(3)
  })
  it('awards a freeze every 7 days, max 2', () => {
    expect(registerGoal(streak({ count: 6, lastGoalDate: addDays(T, -1), freezes: 0 }), T).earnedFreeze).toBe(true)
    expect(registerGoal(streak({ count: 6, lastGoalDate: addDays(T, -1), freezes: 2 }), T).earnedFreeze).toBe(false)
  })
  it('does nothing if last goal day was yesterday or today', () => {
    const s = streak({ count: 5, lastGoalDate: addDays(T, -1), freezes: 1 })
    expect(reconcileStreak(s, T)).toEqual({ streak: s, frozenDays: [], lost: 0 })
  })
  it('spends freezes to cover missed days', () => {
    const r = reconcileStreak(streak({ count: 5, lastGoalDate: addDays(T, -3), freezes: 2 }), T)
    expect(r.frozenDays).toEqual([addDays(T, -2), addDays(T, -1)])
    expect(r.streak.freezes).toBe(0)
    expect(r.streak.count).toBe(5)
    expect(r.streak.lastGoalDate).toBe(addDays(T, -1))
    // hitting the goal today continues the streak
    expect(registerGoal(r.streak, T).streak.count).toBe(6)
  })
  it('resets when there are not enough freezes', () => {
    const r = reconcileStreak(streak({ count: 12, lastGoalDate: addDays(T, -4), freezes: 1 }), T)
    expect(r.lost).toBe(12)
    expect(r.streak.count).toBe(0)
    expect(r.streak.freezes).toBe(1)
  })
})

describe('quests', () => {
  const ctx = { dailyGoal: 30, srsSize: 10, toolsUnlocked: 3 }
  it('is deterministic per date and always includes an XP quest', () => {
    const a = generateQuests(T, ctx)
    expect(generateQuests(T, ctx)).toEqual(a)
    expect(a.list).toHaveLength(3)
    expect(a.list[0]).toMatchObject({ type: 'xp', target: 50 })
    expect(new Set(a.list.map((q) => q.type)).size).toBe(3)
  })
  it('does not offer review quests without a deck', () => {
    for (let i = 0; i < 30; i++) {
      const b = generateQuests(addDays(T, i), { ...ctx, srsSize: 0, toolsUnlocked: 0 })
      expect(b.list.some((q) => q.type === 'review' || q.type === 'tool')).toBe(false)
    }
  })
  it('tracks progress and completion', () => {
    let board = generateQuests(T, ctx)
    const r = applyQuestEvent(board, 'xp', 60)
    expect(r.board.list[0].progress).toBe(50)
    expect(r.justCompleted).toHaveLength(1)
    board = r.board
    for (const q of board.list.slice(1)) {
      const ev = { lesson: 'lesson', arena: 'arena_correct', perfect: 'perfect', daily: 'daily', review: 'review_correct', tool: 'tool_view', xp: 'xp' } as const
      board = applyQuestEvent(board, ev[q.type], q.target).board
    }
    expect(allQuestsDone(board)).toBe(true)
  })
})

describe('reminders', () => {
  const at = (h: number, m = 0): Date => new Date(2026, 10, 8, h, m)
  const base = (): AppState => {
    const s = defaultState()
    s.settings.reminderTime = '19:00'
    return s
  }
  it('fires the reminder after reminder time once per day', () => {
    const s = base()
    expect(decideReminder(s, {}, at(18, 59))).toBe(null)
    expect(decideReminder(s, {}, at(19, 0))).toBe('reminder')
    expect(decideReminder(s, { reminder: T }, at(20))).toBe(null)
  })
  it('fires the danger alert when the streak is at risk', () => {
    const s = base()
    s.streak = streak({ count: 4, lastGoalDate: addDays(T, -1) })
    expect(dangerMinutes('19:00')).toBe(21 * 60)
    expect(decideReminder(s, { reminder: T }, at(21, 0))).toBe('danger')
    expect(decideReminder(s, { reminder: T, danger: T }, at(22))).toBe(null)
  })
  it('stays quiet when the goal is met or reminders are off', () => {
    const s = base()
    s.days[T] = { xp: 40, goalMet: true }
    expect(decideReminder(s, {}, at(20))).toBe(null)
    const off = base()
    off.settings.startupMode = 'off'
    expect(decideReminder(off, {}, at(20))).toBe(null)
  })
})
