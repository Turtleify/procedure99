import type { AppState } from '../../../shared/types'
import { DESIGN_PROBLEMS } from '../content/design-problems'
import { TOOLS } from '../content/tools'
import { ACHIEVEMENTS } from './achievements'
import { LESSONS, TOOL_LESSONS } from './progress'
import { TREE_NODES } from './skilltree'

export interface ProgressPart {
  key: string
  label: string
  icon: string
  /** CSS colour for the wheel segment */
  color: string
  done: number
  total: number
  /** share of the overall 100% this part is worth */
  weight: number
  /** where clicking it goes */
  view: 'path' | 'lab' | 'toolbox' | 'trophies'
  params?: Record<string, string>
}

export interface OverallProgress {
  /** 0–1 across the whole app */
  pct: number
  parts: ProgressPart[]
}

/**
 * "How much of Blueprint have you done?" Each area is worth a fixed share
 * (lessons count most) so finishing one area can't max out the total.
 */
export function overallProgress(s: AppState): OverallProgress {
  const parts: ProgressPart[] = [
    {
      key: 'concepts',
      label: 'Concepts',
      icon: 'lightbulb',
      color: '#1a6f8c',
      done: LESSONS.filter((l) => s.completed[l.id]).length,
      total: LESSONS.length,
      weight: 0.35,
      view: 'path'
    },
    {
      key: 'tools',
      label: 'Tools track',
      icon: 'wrench',
      color: '#2b8a3e',
      done: TOOL_LESSONS.filter((l) => s.completed[l.id]).length,
      total: TOOL_LESSONS.length,
      weight: 0.25,
      view: 'path',
      params: { track: 'tools' }
    },
    {
      key: 'design',
      label: 'Design Lab',
      icon: 'pen-tool',
      color: '#5f3dc4',
      done: DESIGN_PROBLEMS.filter((p) => s.designs?.[p.id]?.solved).length,
      total: DESIGN_PROBLEMS.length,
      weight: 0.15,
      view: 'lab'
    },
    {
      key: 'mastery',
      label: 'Mastery',
      icon: 'star',
      color: '#b8860b',
      done: TREE_NODES.filter((n) => s.mastered?.[n.id]).length,
      total: TREE_NODES.length,
      weight: 0.1,
      view: 'path'
    },
    {
      key: 'toolbox',
      label: 'Toolbox',
      icon: 'book-open',
      color: '#c2410c',
      done: TOOLS.filter((t) => s.toolsViewed[t.id]).length,
      total: TOOLS.length,
      weight: 0.1,
      view: 'toolbox'
    },
    {
      key: 'trophies',
      label: 'Trophies',
      icon: 'trophy',
      color: '#a61e4d',
      done: ACHIEVEMENTS.filter((a) => s.achievements[a.id]).length,
      total: ACHIEVEMENTS.length,
      weight: 0.05,
      view: 'trophies'
    }
  ]
  const pct = parts.reduce((sum, p) => sum + (p.total ? (p.done / p.total) * p.weight : 0), 0)
  return { pct: Math.min(1, pct), parts }
}

/** "37%" but never rounds a little progress down to 0 or a near-finish up to 100. */
export function pctLabel(pct: number): string {
  if (pct > 0 && pct < 0.01) return '<1%'
  if (pct < 1 && pct > 0.99) return '99%'
  return `${Math.round(pct * 100)}%`
}
