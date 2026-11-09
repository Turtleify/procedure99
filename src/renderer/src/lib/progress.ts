import type { AppState, Lesson, Question, Scenario, Unit } from '../../../shared/types'
import { CURRICULUM } from '../content/curriculum'
import { SCENARIOS } from '../content/scenarios'
import { COMPARISONS, TOOLS } from '../content/tools'
import { hashStr } from './rng'

export type FlatLesson = Lesson & { unitIndex: number; unit: Unit; index: number }

export const LESSONS: FlatLesson[] = CURRICULUM.flatMap((unit, unitIndex) =>
  unit.lessons.map((l) => ({ ...l, unitIndex, unit }) as FlatLesson)
).map((l, index) => ({ ...l, index }))

export const LESSON_BY_ID: Record<string, FlatLesson> = Object.fromEntries(LESSONS.map((l) => [l.id, l]))

export const UNIT_INDEX: Record<string, number> = Object.fromEntries(CURRICULUM.map((u, i) => [u.id, i]))

export const qid = (lessonId: string, i: number): string => `${lessonId}#${i}`

export const QUESTIONS: Record<string, Question & { lessonId: string }> = {}
for (const l of LESSONS) {
  if (l.type === 'lesson') l.quiz.forEach((q, i) => (QUESTIONS[qid(l.id, i)] = { ...q, lessonId: l.id }))
}

export const LAB_COUNT = LESSONS.filter((l) => l.type === 'lab').length

export const isDone = (s: AppState, lessonId: string): boolean => !!s.completed[lessonId]

export function isUnlocked(s: AppState, lessonId: string): boolean {
  const l = LESSON_BY_ID[lessonId]
  if (!l) return false
  return l.index === 0 || isDone(s, LESSONS[l.index - 1].id)
}

export function nextLesson(s: AppState): FlatLesson | null {
  return LESSONS.find((l) => !isDone(s, l.id)) ?? null
}

export function unitComplete(s: AppState, unit: Unit): boolean {
  return unit.lessons.every((l) => isDone(s, l.id))
}

export function completedUnitIds(s: AppState): string[] {
  return CURRICULUM.filter((u) => unitComplete(s, u)).map((u) => u.id)
}

/** Index of the unit you're currently working through (last unit if everything is done). */
export function currentUnitIndex(s: AppState): number {
  return nextLesson(s)?.unitIndex ?? CURRICULUM.length - 1
}

export function unlockedTools(s: AppState): typeof TOOLS {
  const done = new Set(completedUnitIds(s))
  return TOOLS.filter((t) => done.has(t.unit))
}

export function unlockedComparisons(s: AppState): typeof COMPARISONS {
  const done = new Set(completedUnitIds(s))
  return COMPARISONS.filter((c) => done.has(c.unit))
}

/** Scenarios from completed units plus the one you're on. */
export function availableScenarios(s: AppState): Scenario[] {
  const cur = currentUnitIndex(s)
  return SCENARIOS.filter((sc) => UNIT_INDEX[sc.unit] <= cur)
}

export function dailyScenario(s: AppState, today: string): Scenario | null {
  // If today's incident was already assigned, keep it stable even if more units unlocked since.
  if (s.daily?.date === today) return SCENARIOS.find((x) => x.id === s.daily!.scenarioId) ?? null
  const pool = availableScenarios(s)
  if (!pool.length) return null
  return pool[hashStr(`daily:${today}`) % pool.length]
}
