import type { AppState, Lesson, Question, Scenario, Unit } from '../../../shared/types'
import { CURRICULUM } from '../content/curriculum'
import { TOOL_TRACK } from '../content/tools-track'
import { SCENARIOS } from '../content/scenarios'
import { COMPARISONS } from '../content/tools'
import { hashStr } from './rng'

export type Track = 'concepts' | 'tools'

/** A lesson plus where it sits: its unit, and its position within its own track. */
export type FlatLesson = Lesson & { unitIndex: number; unit: Unit; index: number; track: Track }

function flatten(units: Unit[], track: Track): FlatLesson[] {
  return units
    .flatMap((unit, unitIndex) => unit.lessons.map((l) => ({ ...l, unitIndex, unit, track }) as FlatLesson))
    .map((l, index) => ({ ...l, index }))
}

/** Concepts track (the original path). */
export const LESSONS: FlatLesson[] = flatten(CURRICULUM, 'concepts')
/** Tools track: modules that teach real tools, each gated by its concept unit(s). */
export const TOOL_LESSONS: FlatLesson[] = flatten(TOOL_TRACK, 'tools')
export const ALL_LESSONS: FlatLesson[] = [...LESSONS, ...TOOL_LESSONS]

export const LESSON_BY_ID: Record<string, FlatLesson> = Object.fromEntries(ALL_LESSONS.map((l) => [l.id, l]))

export const UNIT_INDEX: Record<string, number> = Object.fromEntries(CURRICULUM.map((u, i) => [u.id, i]))
export const TOOL_UNIT_INDEX: Record<string, number> = Object.fromEntries(TOOL_TRACK.map((u, i) => [u.id, i]))

/** "Unit 04 · Traffic" */
export const conceptUnitLabel = (id: string): string => {
  const i = UNIT_INDEX[id]
  return i === undefined ? id : `Unit ${String(i + 1).padStart(2, '0')} · ${CURRICULUM[i].title}`
}
/** "T9" */
export const moduleCode = (unit: Unit): string => `T${(TOOL_UNIT_INDEX[unit.id] ?? 0) + 1}`

export const qid = (lessonId: string, i: number): string => `${lessonId}#${i}`

export const QUESTIONS: Record<string, Question & { lessonId: string }> = {}
for (const l of ALL_LESSONS) {
  if (l.type === 'lesson') l.quiz.forEach((q, i) => (QUESTIONS[qid(l.id, i)] = { ...q, lessonId: l.id }))
}

export const LAB_COUNT = LESSONS.filter((l) => l.type === 'lab').length

export const isDone = (s: AppState, lessonId: string): boolean => !!s.completed[lessonId]

export function conceptUnitDone(s: AppState, unitId: string): boolean {
  const u = CURRICULUM[UNIT_INDEX[unitId]]
  return !!u && unitComplete(s, u)
}

/** A tools module opens once every concept unit it builds on is finished. */
export function moduleUnlocked(s: AppState, unit: Unit): boolean {
  return (unit.requires ?? []).every((id) => conceptUnitDone(s, id))
}

export function isUnlocked(s: AppState, lessonId: string): boolean {
  const l = LESSON_BY_ID[lessonId]
  if (!l) return false
  if (l.track === 'concepts') return l.index === 0 || isDone(s, LESSONS[l.index - 1].id)
  // tools: module must be open; lessons inside a module go in order
  if (!moduleUnlocked(s, l.unit)) return false
  const prev = TOOL_LESSONS[l.index - 1]
  return !prev || prev.unit.id !== l.unit.id || isDone(s, prev.id)
}

/** Next lesson on the concepts path. */
export function nextLesson(s: AppState): FlatLesson | null {
  return LESSONS.find((l) => !isDone(s, l.id)) ?? null
}

/** First unfinished lesson in any open tools module. */
export function nextToolLesson(s: AppState): FlatLesson | null {
  return TOOL_LESSONS.find((l) => !isDone(s, l.id) && isUnlocked(s, l.id)) ?? null
}

/** What to offer after finishing a lesson: the next one in the same track. */
export function lessonAfter(s: AppState, l: FlatLesson): FlatLesson | null {
  if (l.track === 'concepts') return LESSONS[l.index + 1] ?? null
  const n = TOOL_LESSONS[l.index + 1]
  if (n && n.unit.id === l.unit.id) return n
  return nextToolLesson(s)
}

export function completedModuleIds(s: AppState): string[] {
  return TOOL_TRACK.filter((u) => unitComplete(s, u)).map((u) => u.id)
}

/** Toolbox ids taught by finished tools modules. */
export function learnedToolIds(s: AppState): Set<string> {
  return new Set(TOOL_TRACK.filter((u) => unitComplete(s, u)).flatMap((u) => u.teaches ?? []))
}

/** The tools module that teaches a given Toolbox entry, if any. */
export const MODULE_FOR_TOOL: Record<string, Unit> = {}
for (const u of TOOL_TRACK) for (const t of u.teaches ?? []) MODULE_FOR_TOOL[t] ??= u

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
