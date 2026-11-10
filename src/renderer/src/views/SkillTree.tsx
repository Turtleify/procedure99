import { useEffect, useRef, useState } from 'react'
import { Bar, Label } from '../components/bits'
import { Icon } from '../components/Icon'
import { TREE_VIEWBOX } from '../content/skilltree'
import { conceptUnitDone, conceptUnitLabel, isDone, isUnlocked, learnedToolIds, nextLesson, nextToolLesson } from '../lib/progress'
import {
  leafPositions,
  lessonsDone,
  masteryPct,
  MASTERY_BOX,
  MASTERY_SHARE,
  NODE_BY_ID,
  nodeState,
  TREE_NODES,
  treeSummary,
  type NodeState,
  type TreeNode
} from '../lib/skilltree'
import { useStore } from '../store'

const R = { unit: 36, module: 29, leaf: 8 }
const TYPE_ICON = { lesson: 'book-open', byte: 'mic', lab: 'flask' } as const
const STATE_LABEL: Record<NodeState, string> = {
  locked: 'Locked',
  available: 'Ready to start',
  progress: 'In progress',
  complete: 'Complete',
  mastered: 'Mastered'
}

/** Smooth connector: vertical-ish along the trunk, horizontal-ish out to branches. */
function edgePath(a: TreeNode, b: TreeNode): string {
  if (b.kind === 'unit') {
    const my = (a.y + b.y) / 2
    return `M${a.x},${a.y} C${a.x},${my} ${b.x},${my} ${b.x},${b.y}`
  }
  const mx = (a.x + b.x) / 2
  return `M${a.x},${a.y} C${mx},${a.y} ${mx},${b.y} ${b.x},${b.y}`
}

function labelProps(n: TreeNode): { x: number; y: number; anchor: 'start' | 'end' | 'middle' } {
  const r = R[n.kind] + 10
  switch (n.label) {
    case 'left':
      return { x: n.x - r, y: n.y, anchor: 'end' }
    case 'right':
      return { x: n.x + r, y: n.y, anchor: 'start' }
    case 'above':
      return { x: n.x, y: n.y - r - 18, anchor: 'middle' }
    default:
      return { x: n.x, y: n.y + r + 18, anchor: 'middle' }
  }
}

function NodePanel({ node }: { node: TreeNode }): JSX.Element {
  const s = useStore((st) => st.s)
  const go = useStore((st) => st.go)
  const state = nodeState(s, node)
  const done = lessonsDone(s, node.unit)
  const total = node.unit.lessons.length
  const mastery = masteryPct(s, node.unit)
  const learned = learnedToolIds(s)
  const next = node.unit.lessons.find((l) => !isDone(s, l.id) && isUnlocked(s, l.id))
  const missing =
    node.kind === 'module'
      ? (node.unit.requires ?? []).filter((id) => !conceptUnitDone(s, id))
      : node.parent && !conceptUnitDone(s, node.parent)
        ? [node.parent]
        : []

  return (
    <aside className="tree-panel card" aria-live="polite">
      <Label bare>{node.kind === 'module' ? `Tools track · ${node.code}` : conceptUnitLabel(node.id)}</Label>
      <h2 className="tree-panel-title">
        <Icon name={node.unit.icon} size={20} />
        {node.unit.title}
      </h2>
      <p className="muted small">{node.unit.subtitle}</p>
      <span className={`tree-state st-${state}`}>
        {state === 'mastered' && <Icon name="star" size={12} />}
        {STATE_LABEL[state]}
      </span>

      {state === 'locked' && missing.length > 0 && (
        <p className="tree-locked-note">
          <Icon name="lock" size={13} /> Unlocks after {missing.map(conceptUnitLabel).join(' and ')}
        </p>
      )}

      <div className="tree-meters">
        <div>
          <div className="tree-meter-row">
            <span>Lessons</span>
            <span>
              {done}/{total}
            </span>
          </div>
          <Bar value={done} max={total} tone="good" />
        </div>
        <div>
          <div className="tree-meter-row">
            <span>Mastery</span>
            <span>{state === 'mastered' ? `Earned ${s.mastered?.[node.id]}` : `${Math.round(mastery * 100)}%`}</span>
          </div>
          <Bar value={state === 'mastered' ? 1 : mastery} max={1} tone="good" />
          {state !== 'mastered' && (
            <p className="muted small tree-hint">
              Finish every lesson, then get {Math.round(MASTERY_SHARE * 100)}% of its questions to box {MASTERY_BOX} in Review. Gold stays once earned.
            </p>
          )}
        </div>
      </div>

      <div className="tree-lessons">
        {node.unit.lessons.map((l) => {
          const d = isDone(s, l.id)
          const open = isUnlocked(s, l.id)
          return (
            <button key={l.id} className={`tree-lesson ${d ? 'done' : ''}`} disabled={!open} onClick={() => go('lesson', { id: l.id })}>
              <Icon name={d ? 'check' : open ? TYPE_ICON[l.type] : 'lock'} size={14} />
              <span>{l.title}</span>
              <span className="muted small">{l.minutes} min</span>
            </button>
          )
        })}
      </div>

      {node.tools.length > 0 && (
        <>
          <Label>Teaches</Label>
          <div className="tree-tools">
            {node.tools.map((t) => (
              <span key={t.id} className={`tag ${learned.has(t.id) ? 'learned' : state === 'locked' ? 'dim' : ''}`}>
                <Icon name={learned.has(t.id) ? 'check' : t.icon} size={12} />
                {t.name}
              </span>
            ))}
          </div>
        </>
      )}

      <div className="tree-actions">
        {next ? (
          <button className="btn primary" onClick={() => go('lesson', { id: next.id })}>
            {done ? 'Continue' : 'Start'}: {next.title} <Icon name="arrow-right" size={15} />
          </button>
        ) : state === 'complete' ? (
          <button className="btn" onClick={() => go('review')}>
            <Icon name="brain" size={15} /> Review to master it
          </button>
        ) : null}
        {node.kind === 'unit' && (
          <button className="btn ghost" onClick={() => go('toolbox', { unit: node.id })}>
            <Icon name="wrench" size={15} /> Its tools
          </button>
        )}
      </div>
    </aside>
  )
}

export function SkillTree({ focus }: { focus?: string }): JSX.Element {
  const s = useStore((st) => st.s)
  const learned = learnedToolIds(s)
  const nextConcept = nextLesson(s)
  const nextTool = nextToolLesson(s)
  const hereIds = new Set([nextConcept?.unit.id, nextTool?.unit.id].filter(Boolean) as string[])
  const [selected, setSelected] = useState<string>(() => (focus && NODE_BY_ID[focus] ? focus : (nextConcept?.unit.id ?? nextTool?.unit.id ?? TREE_NODES[0].id)))
  const selRef = useRef<SVGGElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const sum = treeSummary(s)

  // on open, scroll the tree's own box (not the page) so the selected node is centred
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const box = canvasRef.current
      const el = selRef.current
      if (!box || !el) return
      const r = el.getBoundingClientRect()
      const b = box.getBoundingClientRect()
      box.scrollTop += r.top + r.height / 2 - (b.top + box.clientHeight / 2)
    })
    return () => cancelAnimationFrame(id)
  }, [])

  const node = NODE_BY_ID[selected] ?? TREE_NODES[0]
  const { width, height } = TREE_VIEWBOX

  return (
    <div className="skilltree">
      <div className="tree-summary">
        {[
          ['Units', sum.units, 'graduation-cap'],
          ['Modules', sum.modules, 'wrench'],
          ['Tools learned', sum.tools, 'badge-check'],
          ['Mastered', sum.mastered, 'star']
        ].map(([label, [a, b], icon]) => (
          <div key={label as string} className="tree-stat">
            <Icon name={icon as string} size={16} />
            <div>
              <div className="readout-k">{label as string}</div>
              <div className="readout-v">
                {a as number}
                <span className="muted">/{b as number}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="tree-layout">
        <div className="tree-canvas card" ref={canvasRef}>
          <svg viewBox={`0 0 ${width} ${height}`} role="group" aria-label="Skill tree">
            {/* connectors */}
            {TREE_NODES.filter((n) => n.parent).map((n) => {
              const st = nodeState(s, n)
              const cls = st === 'complete' || st === 'mastered' ? 'lit' : st === 'locked' ? 'locked' : 'open'
              return <path key={`e-${n.id}`} d={edgePath(NODE_BY_ID[n.parent!], n)} className={`t-edge ${cls} ${n.kind === 'unit' ? 'trunk' : ''}`} />
            })}

            {/* leaves: tools each module teaches */}
            {TREE_NODES.filter((n) => n.kind === 'module').map((n) => {
              const st = nodeState(s, n)
              return leafPositions(n).map((p, i) => {
                const t = n.tools[i]
                const isLearned = learned.has(t.id)
                const cls = isLearned ? 'learned' : st === 'locked' ? 'locked' : 'open'
                return (
                  <g key={`${n.id}-${t.id}`} className={`t-leaf ${cls}`}>
                    <line x1={n.x} y1={n.y} x2={p.x} y2={p.y} />
                    <circle cx={p.x} cy={p.y} r={R.leaf}>
                      <title>
                        {t.name}
                        {isLearned ? ' (learned)' : ''}
                      </title>
                    </circle>
                  </g>
                )
              })
            })}

            {/* nodes */}
            {TREE_NODES.map((n) => {
              const st = nodeState(s, n)
              const r = R[n.kind]
              const frac = lessonsDone(s, n.unit) / n.unit.lessons.length
              const circ = 2 * Math.PI * (r + 5)
              const lp = labelProps(n)
              const isSel = n.id === selected
              const select = (): void => setSelected(n.id)
              return (
                <g
                  key={n.id}
                  ref={isSel ? selRef : undefined}
                  className={`t-node k-${n.kind} st-${st} ${isSel ? 'sel' : ''} ${hereIds.has(n.id) ? 'here' : ''}`}
                  transform={`translate(${n.x} ${n.y})`}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSel}
                  aria-label={`${n.kind === 'module' ? `Module ${n.code}` : `Unit ${n.code}`}: ${n.unit.title}. ${STATE_LABEL[st]}.`}
                  onClick={select}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      select()
                    }
                  }}
                >
                  {hereIds.has(n.id) && <circle r={r + 12} className="t-here" />}
                  <circle r={r + 5} className="t-ring-bg" />
                  {frac > 0 && st !== 'locked' && <circle r={r + 5} className="t-ring" strokeDasharray={`${circ * frac} ${circ}`} transform="rotate(-90)" />}
                  <circle r={r} className="t-core" />
                  {st === 'locked' ? (
                    <g className="t-lock" transform="translate(-10.5 -12) scale(1.5)">
                      <rect x={1} y={6} width={12} height={9} rx={2} />
                      <path d="M3.5 6 V4 a3.5 3.5 0 0 1 7 0 V6" />
                    </g>
                  ) : (
                    <text className="t-code" dy="0.35em">
                      {n.code}
                    </text>
                  )}
                  {st === 'mastered' && (
                    <text className="t-star" x={r - 2} y={-r + 4}>
                      ★
                    </text>
                  )}
                  <text className={`t-label a-${lp.anchor}`} x={lp.x - n.x} y={lp.y - n.y + (n.labelDy ?? 0)} textAnchor={lp.anchor} dy="0.35em">
                    {n.short ?? n.unit.title}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
        <NodePanel node={node} />
      </div>
    </div>
  )
}
