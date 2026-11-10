/**
 * Skill tree layout (hand-placed; coordinates are in the SVG viewBox below).
 *
 * The trunk is the concepts track, running from Foundations at the top down
 * to the Capstone at the bottom. Tools modules branch off to the side of the
 * concept unit that unlocks them, and each module's tools fan out as leaves.
 * Connections come from the course data (unit order and `requires`), so this
 * file only says *where* things go.
 */

export const TREE_VIEWBOX = { width: 1000, height: 1430 }

export type Side = 'left' | 'right'
export type LabelPos = 'left' | 'right' | 'above' | 'below'

export interface NodePlacement {
  x: number
  y: number
  /** which way a module's leaves fan out (modules only) */
  side?: Side
  /** where the label sits relative to the node */
  label: LabelPos
  /** shorter display name when the full title is too long for the tree */
  short?: string
  /** nudge the label up/down, e.g. to clear a connector leaving the node sideways */
  labelDy?: number
}

export const PLACEMENTS: Record<string, NodePlacement> = {
  // trunk: concept units, top (start) to bottom (capstone)
  u1: { x: 500, y: 70, label: 'right' },
  u2: { x: 560, y: 220, label: 'right' },
  u3: { x: 440, y: 370, label: 'right', short: 'Architecture' },
  u4: { x: 560, y: 520, label: 'left', labelDy: -26 },
  u5: { x: 440, y: 670, label: 'right' },
  u6: { x: 560, y: 820, label: 'below' },
  u7: { x: 440, y: 970, label: 'right' },
  u8: { x: 560, y: 1120, label: 'left', short: 'Replication & Sharding' },
  u9: { x: 500, y: 1315, label: 'below' },

  // branches: tools modules (left side fans left, right side fans right)
  t1: { x: 200, y: 90, side: 'left', label: 'right', short: 'Cloud basics' },
  t2: { x: 200, y: 300, side: 'left', label: 'right' },
  t3: { x: 200, y: 520, side: 'left', label: 'right', short: 'Orchestration' },
  t4: { x: 800, y: 425, side: 'right', label: 'left', short: 'Traffic' },
  t5: { x: 800, y: 585, side: 'right', label: 'left', short: 'Auth' },
  t7: { x: 200, y: 670, side: 'left', label: 'right', short: 'NoSQL' },
  t6: { x: 200, y: 815, side: 'left', label: 'right', short: 'Postgres' },
  t8: { x: 800, y: 800, side: 'right', label: 'left' },
  t9: { x: 200, y: 970, side: 'left', label: 'right', short: 'Caching' },
  t10: { x: 800, y: 1045, side: 'right', label: 'left' },
  t11: { x: 800, y: 1190, side: 'right', label: 'left' },
  t12: { x: 200, y: 1340, side: 'left', label: 'right' },
  t13: { x: 800, y: 1340, side: 'right', label: 'left' }
}
