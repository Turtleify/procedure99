import type { AppState, Tool, Unit } from '../../../shared/types'
import { CURRICULUM } from '../content/curriculum'
import { PLACEMENTS, type NodePlacement } from '../content/skilltree'
import { TOOLS } from '../content/tools'
import { TOOL_TRACK } from '../content/tools-track'
import { isDone, isUnlocked, learnedToolIds, moduleCode, moduleUnlocked, qid, UNIT_INDEX, unitComplete } from './progress'

/** A question counts toward mastery once Review has moved it to this Leitner box (two good reviews after the lesson). */
export const MASTERY_BOX = 4
/** Share of a node's questions that must reach MASTERY_BOX (once all its lessons are done). */
export const MASTERY_SHARE = 0.8

export type NodeState = 'locked' | 'available' | 'progress' | 'complete' | 'mastered'

export interface TreeNode extends NodePlacement {
  id: string
  kind: 'unit' | 'module'
  unit: Unit
  /** "01" for units, "T9" for modules */
  code: string
  /** node this one grows from (previous trunk unit, or the unit that unlocks a module) */
  parent: string | null
  /** Toolbox entries this module teaches (leaves); empty for units */
  tools: Tool[]
}

const TOOL_BY_ID = Object.fromEntries(TOOLS.map((t) => [t.id, t]))

/** The unit that actually gates a module: the latest of its requirements (concept units unlock in order). */
function gatingUnit(m: Unit): string | null {
  const reqs = m.requires ?? []
  if (!reqs.length) return null
  return reqs.reduce((a, b) => ((UNIT_INDEX[b] ?? -1) > (UNIT_INDEX[a] ?? -1) ? b : a))
}

function place(id: string): NodePlacement {
  // Fallback keeps the app working if a new unit/module is added without a placement (tests catch it).
  return PLACEMENTS[id] ?? { x: 500, y: 40, label: 'below' }
}

export const TREE_NODES: TreeNode[] = [
  ...CURRICULUM.map(
    (u, i): TreeNode => ({
      ...place(u.id),
      id: u.id,
      kind: 'unit',
      unit: u,
      code: String(i + 1).padStart(2, '0'),
      parent: i > 0 ? CURRICULUM[i - 1].id : null,
      tools: []
    })
  ),
  ...TOOL_TRACK.map(
    (m): TreeNode => ({
      ...place(m.id),
      id: m.id,
      kind: 'module',
      unit: m,
      code: moduleCode(m),
      parent: gatingUnit(m),
      tools: (m.teaches ?? []).map((id) => TOOL_BY_ID[id]).filter(Boolean)
    })
  )
]

export const NODE_BY_ID: Record<string, TreeNode> = Object.fromEntries(TREE_NODES.map((n) => [n.id, n]))

export function nodeQuestionIds(unit: Unit): string[] {
  return unit.lessons.flatMap((l) => (l.type === 'lesson' ? l.quiz.map((_, i) => qid(l.id, i)) : []))
}

/** 0–1: share of the node's questions that Review has moved to MASTERY_BOX or higher. */
export function masteryPct(s: AppState, unit: Unit): number {
  const ids = nodeQuestionIds(unit)
  if (!ids.length) return 0
  return ids.filter((id) => (s.srs[id]?.box ?? 0) >= MASTERY_BOX).length / ids.length
}

/** Whether mastery has been reached right now (it's then saved in s.mastered and kept). */
export function earnsMastery(s: AppState, unit: Unit): boolean {
  return unitComplete(s, unit) && masteryPct(s, unit) >= MASTERY_SHARE
}

export function lessonsDone(s: AppState, unit: Unit): number {
  return unit.lessons.filter((l) => isDone(s, l.id)).length
}

export function nodeUnlocked(s: AppState, n: TreeNode): boolean {
  return n.kind === 'module' ? moduleUnlocked(s, n.unit) : isUnlocked(s, n.unit.lessons[0].id)
}

export function nodeState(s: AppState, n: TreeNode): NodeState {
  if (s.mastered?.[n.id]) return 'mastered'
  if (!nodeUnlocked(s, n)) return 'locked'
  const done = lessonsDone(s, n.unit)
  if (done >= n.unit.lessons.length) return 'complete'
  return done > 0 ? 'progress' : 'available'
}

/** Leaf positions for a module's tools, fanned outward away from the trunk. */
export function leafPositions(n: TreeNode, radius = 68): { x: number; y: number }[] {
  const count = n.tools.length
  if (!count) return []
  const center = n.side === 'right' ? 0 : 180
  const span = count === 1 ? 0 : Math.min(136, 20 * (count - 1))
  return n.tools.map((_, i) => {
    const deg = center + (count === 1 ? 0 : span * (i / (count - 1) - 0.5))
    const rad = (deg * Math.PI) / 180
    return { x: n.x + radius * Math.cos(rad), y: n.y + radius * Math.sin(rad) }
  })
}

export interface TreeSummary {
  units: [number, number]
  modules: [number, number]
  tools: [number, number]
  mastered: [number, number]
}

export function treeSummary(s: AppState): TreeSummary {
  const units = TREE_NODES.filter((n) => n.kind === 'unit')
  const modules = TREE_NODES.filter((n) => n.kind === 'module')
  const taught = new Set(modules.flatMap((m) => m.tools.map((t) => t.id)))
  const learned = learnedToolIds(s)
  return {
    units: [units.filter((n) => unitComplete(s, n.unit)).length, units.length],
    modules: [modules.filter((n) => unitComplete(s, n.unit)).length, modules.length],
    tools: [[...taught].filter((id) => learned.has(id)).length, taught.size],
    mastered: [TREE_NODES.filter((n) => s.mastered?.[n.id]).length, TREE_NODES.length]
  }
}
