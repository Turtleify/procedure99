import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import type { Diagram, DiagramEdge, DiagramNode, ShapeKind } from '../../../shared/types'
import { canScale, KIND, KINDS, SHAPE_GROUPS } from '../lib/design'
import { labelInside, ShapeBody, ShapeNode } from './DesignShapes'
import { Icon } from './Icon'

export type Tool = 'select' | 'hand' | 'arrow' | 'text'

interface View {
  x: number
  y: number
  z: number
}

type Drag =
  | { type: 'move'; start: Pt; before: Diagram; ids: string[]; orig: Record<string, Pt>; moved: boolean }
  | { type: 'pan'; start: Pt; view: View }
  | { type: 'marquee'; start: Pt; cur: Pt; additive: boolean; base: string[] }
  | { type: 'arrow'; from: string; cur: Pt; over: string | null }
  | { type: 'resize'; id: string; start: Pt; before: Diagram; w: number; h: number }

interface Pt {
  x: number
  y: number
}

interface Selection {
  nodes: string[]
  edges: string[]
}

const NONE: Selection = { nodes: [], edges: [] }
const MIN_Z = 0.25
const MAX_Z = 2.5
const TOOLS: { tool: Tool; icon: string; label: string; key: string }[] = [
  { tool: 'select', icon: 'mouse-pointer', label: 'Select', key: 'V' },
  { tool: 'hand', icon: 'hand', label: 'Pan', key: 'H' },
  { tool: 'arrow', icon: 'arrow-up-right', label: 'Arrow', key: 'A' },
  { tool: 'text', icon: 'type', label: 'Text', key: 'T' }
]

let idSeq = 0
const newId = (p: string): string => `${p}${Date.now().toString(36)}${(idSeq++).toString(36)}`

const center = (n: DiagramNode): Pt => ({ x: n.x + n.w / 2, y: n.y + n.h / 2 })
const textWidth = (s: string): number => Math.max(24, Math.round(s.length * 7.8) + 6)
const ROUND: ShapeKind[] = ['dns', 'lb']

/** Room under a shape for its label, so arrows leaving downward don't run through the text. */
const LABEL_PAD = 26

/** Where a line from the node's centre toward `toward` leaves the shape (plus a small gap). */
function clip(n: DiagramNode, toward: Pt, gap = 7): Pt {
  const c = center(n)
  const dx = toward.x - c.x
  const dy = toward.y - c.y
  if (!dx && !dy) return c
  if (ROUND.includes(n.kind)) {
    const hw = n.w / 2 + gap
    const hh = n.h / 2 + gap
    const s = 1 / Math.sqrt((dx / hw) ** 2 + (dy / hh) ** 2)
    // leaving through the bottom: clear the label as well
    if (dy * s < hh * 0.7) return { x: c.x + dx * s, y: c.y + dy * s }
  }
  const left = n.w / 2 + gap
  const up = n.h / 2 + gap
  const down = n.h / 2 + gap + (labelInside(n.kind) ? 0 : LABEL_PAD)
  const sx = dx ? left / Math.abs(dx) : Infinity
  const sy = dy ? (dy > 0 ? down : up) / Math.abs(dy) : Infinity
  const s = Math.min(sx, sy)
  return { x: c.x + dx * s, y: c.y + dy * s }
}

function edgeEnds(a: DiagramNode, b: DiagramNode): [Pt, Pt] {
  return [clip(a, center(b)), clip(b, center(a))]
}

function bounds(nodes: DiagramNode[]): { x: number; y: number; w: number; h: number } | null {
  if (!nodes.length) return null
  const x1 = Math.min(...nodes.map((n) => n.x))
  const y1 = Math.min(...nodes.map((n) => n.y))
  const x2 = Math.max(...nodes.map((n) => n.x + n.w))
  const y2 = Math.max(...nodes.map((n) => n.y + n.h + (labelInside(n.kind) ? 0 : 30)))
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 }
}

function nodeAt(d: Diagram, p: Pt, pad = 6): DiagramNode | null {
  for (let i = d.nodes.length - 1; i >= 0; i--) {
    const n = d.nodes[i]
    if (p.x >= n.x - pad && p.x <= n.x + n.w + pad && p.y >= n.y - pad && p.y <= n.y + n.h + pad) return n
  }
  return null
}

/** Small preview of a shape for the library and the drag ghost. */
export function ShapeIcon({ kind, size = 44 }: { kind: ShapeKind; size?: number }): JSX.Element {
  const m = KIND[kind]
  if (kind === 'text') {
    return (
      <svg width={size} height={size} viewBox="0 0 44 44" aria-hidden>
        <text x={22} y={22} dy="0.35em" textAnchor="middle" className="dl-text" style={{ fontSize: 20 }}>
          Aa
        </text>
      </svg>
    )
  }
  const pad = 4
  const scale = Math.min((size - pad * 2) / m.w, (size - pad * 2) / m.h)
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <g transform={`translate(${(size - m.w * scale) / 2} ${(size - m.h * scale) / 2}) scale(${scale})`}>
        <ShapeBody kind={kind} w={m.w} h={m.h} />
      </g>
    </svg>
  )
}

interface Props {
  diagram: Diagram
  /** called after every finished change (drop, move, edit, delete, undo…) */
  onChange?: (d: Diagram) => void
  readOnly?: boolean
}

export function DesignCanvas({ diagram: initial, onChange, readOnly }: Props): JSX.Element {
  const [d, setD] = useState<Diagram>(initial)
  const dRef = useRef(d)
  dRef.current = d
  const [view, setView] = useState<View>({ x: 0, y: 0, z: 1 })
  const viewRef = useRef(view)
  viewRef.current = view
  const [tool, setTool] = useState<Tool>('select')
  const [sel, setSel] = useState<Selection>(NONE)
  const [drag, setDrag] = useState<Drag | null>(null)
  const dragRef = useRef<Drag | null>(null)
  const [hover, setHover] = useState<string | null>(null)
  const [editing, setEditing] = useState<{ type: 'node' | 'edge'; id: string; value: string } | null>(null)
  const [spaceDown, setSpaceDown] = useState(false)
  const [ghost, setGhost] = useState<{ kind: ShapeKind; x: number; y: number; moved: boolean } | null>(null)
  const [libOpen, setLibOpen] = useState(true)
  const past = useRef<Diagram[]>([])
  const future = useRef<Diagram[]>([])
  const wrapRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const setDragBoth = (v: Drag | null): void => {
    dragRef.current = v
    setDrag(v)
  }

  // ───────── history ─────────

  const commit = useCallback(
    (next: Diagram, before: Diagram = dRef.current) => {
      past.current.push(before)
      if (past.current.length > 100) past.current.shift()
      future.current = []
      dRef.current = next
      setD(next)
      onChange?.(next)
    },
    [onChange]
  )

  const undo = (): void => {
    const prev = past.current.pop()
    if (!prev) return
    future.current.push(dRef.current)
    setD(prev)
    setSel(NONE)
    onChange?.(prev)
  }
  const redo = (): void => {
    const next = future.current.pop()
    if (!next) return
    past.current.push(dRef.current)
    setD(next)
    setSel(NONE)
    onChange?.(next)
  }

  // ───────── coordinates & view ─────────

  const toWorld = (clientX: number, clientY: number): Pt => {
    const r = svgRef.current!.getBoundingClientRect()
    const v = viewRef.current
    return { x: (clientX - r.left - v.x) / v.z, y: (clientY - r.top - v.y) / v.z }
  }

  const fit = useCallback((nodes = dRef.current.nodes) => {
    const el = svgRef.current
    if (!el) return
    const W = el.clientWidth
    const H = el.clientHeight
    const b = bounds(nodes)
    if (!b) return setView({ x: W / 2 - 300, y: 80, z: 1 })
    const z = Math.min(1.1, Math.max(MIN_Z, Math.min((W - 60) / (b.w + 40), (H - 100) / (b.h + 40))))
    setView({ x: W / 2 - (b.x + b.w / 2) * z, y: H / 2 - (b.y + b.h / 2) * z, z })
  }, [])

  useLayoutEffect(() => fit(), [fit])

  const zoomAt = (factor: number, sx?: number, sy?: number): void => {
    const el = svgRef.current
    if (!el) return
    const v = viewRef.current
    const px = sx ?? el.clientWidth / 2
    const py = sy ?? el.clientHeight / 2
    const z = Math.min(MAX_Z, Math.max(MIN_Z, v.z * factor))
    setView({ x: px - ((px - v.x) / v.z) * z, y: py - ((py - v.y) / v.z) * z, z })
  }

  // wheel: pan, ctrl/pinch: zoom (needs a non-passive listener)
  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const onWheel = (e: WheelEvent): void => {
      e.preventDefault()
      if (e.ctrlKey || e.metaKey) {
        const r = el.getBoundingClientRect()
        zoomAt(Math.exp(-e.deltaY * 0.0022), e.clientX - r.left, e.clientY - r.top)
      } else {
        setView((v) => ({ ...v, x: v.x - (e.shiftKey ? e.deltaY : e.deltaX), y: v.y - (e.shiftKey ? 0 : e.deltaY) }))
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  // ───────── edits ─────────

  const addNode = (kind: ShapeKind, at: Pt, edit = false): void => {
    const m = KIND[kind]
    const node: DiagramNode = {
      id: newId('n'),
      kind,
      x: Math.round(at.x - m.w / 2),
      y: Math.round(at.y - m.h / 2),
      w: m.w,
      h: m.h,
      label: kind === 'text' ? '' : m.name
    }
    commit({ ...dRef.current, nodes: [...dRef.current.nodes, node] })
    setSel({ nodes: [node.id], edges: [] })
    if (edit) setEditing({ type: 'node', id: node.id, value: '' })
  }

  const deleteSelection = (): void => {
    if (!sel.nodes.length && !sel.edges.length) return
    const cur = dRef.current
    const gone = new Set(sel.nodes)
    commit({
      nodes: cur.nodes.filter((n) => !gone.has(n.id)),
      edges: cur.edges.filter((e) => !sel.edges.includes(e.id) && !gone.has(e.from) && !gone.has(e.to))
    })
    setSel(NONE)
  }

  const duplicateSelection = (): void => {
    if (!sel.nodes.length) return
    const cur = dRef.current
    const map: Record<string, string> = {}
    const copies = cur.nodes.filter((n) => sel.nodes.includes(n.id)).map((n) => ((map[n.id] = newId('n')), { ...n, id: map[n.id], x: n.x + 24, y: n.y + 24 }))
    const edges = cur.edges.filter((e) => map[e.from] && map[e.to]).map((e) => ({ ...e, id: newId('e'), from: map[e.from], to: map[e.to] }))
    commit({ nodes: [...cur.nodes, ...copies], edges: [...cur.edges, ...edges] })
    setSel({ nodes: copies.map((n) => n.id), edges: [] })
  }

  const updateNode = (id: string, patch: Partial<DiagramNode>): void => {
    commit({ ...dRef.current, nodes: dRef.current.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)) })
  }
  const updateEdge = (id: string, patch: Partial<DiagramEdge>): void => {
    commit({ ...dRef.current, edges: dRef.current.edges.map((e) => (e.id === id ? { ...e, ...patch } : e)) })
  }

  const finishEditing = (save: boolean): void => {
    if (!editing) return
    const { type, id, value } = editing
    setEditing(null)
    const v = value.trim()
    if (type === 'edge') {
      if (save) updateEdge(id, { label: v || undefined })
      return
    }
    const n = dRef.current.nodes.find((x) => x.id === id)
    if (!n) return
    if (n.kind === 'text' && !v) {
      // an empty note is just removed (it was never anything)
      const nodes = dRef.current.nodes.filter((x) => x.id !== id)
      dRef.current = { ...dRef.current, nodes }
      setD(dRef.current)
      onChange?.(dRef.current)
      setSel(NONE)
      return
    }
    if (save && v !== n.label) updateNode(id, { label: v, ...(n.kind === 'text' ? { w: textWidth(v) } : {}) })
  }

  // ───────── keyboard ─────────

  useEffect(() => {
    if (readOnly) return
    const typing = (e: KeyboardEvent): boolean => {
      const t = e.target as HTMLElement | null
      return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)
    }
    const down = (e: KeyboardEvent): void => {
      if (typing(e)) return
      const mod = e.ctrlKey || e.metaKey
      const k = e.key.toLowerCase()
      if (e.key === ' ' && !e.repeat) {
        setSpaceDown(true)
        e.preventDefault()
        return
      }
      if (mod && k === 'z') return (e.preventDefault(), e.shiftKey ? redo() : undo())
      if (mod && k === 'y') return (e.preventDefault(), redo())
      if (mod && k === 'd') return (e.preventDefault(), duplicateSelection())
      if (mod && k === 'a') return (e.preventDefault(), setSel({ nodes: dRef.current.nodes.map((n) => n.id), edges: dRef.current.edges.map((x) => x.id) }))
      if (mod && (k === '=' || k === '+')) return (e.preventDefault(), zoomAt(1.2))
      if (mod && k === '-') return (e.preventDefault(), zoomAt(1 / 1.2))
      if (mod && k === '0') return (e.preventDefault(), fit())
      if (mod) return
      if (e.key === 'Delete' || e.key === 'Backspace') return (e.preventDefault(), deleteSelection())
      if (e.key === 'Escape') return (setSel(NONE), setTool('select'))
      if (e.key === 'Enter' && sel.nodes.length === 1 && !sel.edges.length) {
        const n = dRef.current.nodes.find((x) => x.id === sel.nodes[0])
        if (n) (e.preventDefault(), setEditing({ type: 'node', id: n.id, value: n.label }))
        return
      }
      if (e.key.startsWith('Arrow') && sel.nodes.length) {
        e.preventDefault()
        const step = e.shiftKey ? 20 : 2
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0
        commit({ ...dRef.current, nodes: dRef.current.nodes.map((n) => (sel.nodes.includes(n.id) ? { ...n, x: n.x + dx, y: n.y + dy } : n)) })
        return
      }
      const t = ({ v: 'select', 1: 'select', h: 'hand', a: 'arrow', t: 'text' } as Record<string, Tool>)[k]
      if (t) setTool(t)
    }
    const up = (e: KeyboardEvent): void => {
      if (e.key === ' ') setSpaceDown(false)
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  })

  // ───────── pointer ─────────

  const panning = tool === 'hand' || spaceDown

  const onCanvasDown = (e: RPointerEvent<SVGSVGElement>): void => {
    if (editing) finishEditing(true)
    const p = toWorld(e.clientX, e.clientY)
    if (e.button === 1 || panning || readOnly) {
      setDragBoth({ type: 'pan', start: { x: e.clientX, y: e.clientY }, view: viewRef.current })
      return
    }
    if (e.button !== 0) return
    if (tool === 'text') {
      addNode('text', { x: p.x + 50, y: p.y })
      setTool('select')
      const id = dRef.current.nodes[dRef.current.nodes.length - 1].id
      setEditing({ type: 'node', id, value: '' })
      return
    }
    const additive = e.shiftKey
    if (!additive) setSel(NONE)
    setDragBoth({ type: 'marquee', start: p, cur: p, additive, base: additive ? sel.nodes : [] })
  }

  const onNodeDown = (e: RPointerEvent, n: DiagramNode): void => {
    if (readOnly || panning || e.button !== 0) return
    e.stopPropagation()
    if (editing) finishEditing(true)
    const p = toWorld(e.clientX, e.clientY)
    if (tool === 'arrow') {
      setDragBoth({ type: 'arrow', from: n.id, cur: p, over: null })
      return
    }
    let ids = sel.nodes
    if (e.shiftKey) {
      ids = ids.includes(n.id) ? ids.filter((x) => x !== n.id) : [...ids, n.id]
      setSel({ nodes: ids, edges: sel.edges })
      if (!ids.includes(n.id)) return
    } else if (!ids.includes(n.id)) {
      ids = [n.id]
      setSel({ nodes: ids, edges: [] })
    }
    const cur = dRef.current
    const orig = Object.fromEntries(cur.nodes.filter((x) => ids.includes(x.id)).map((x) => [x.id, { x: x.x, y: x.y }]))
    setDragBoth({ type: 'move', start: p, before: cur, ids, orig, moved: false })
  }

  const onPortDown = (e: RPointerEvent, n: DiagramNode): void => {
    if (readOnly || e.button !== 0) return
    e.stopPropagation()
    setDragBoth({ type: 'arrow', from: n.id, cur: toWorld(e.clientX, e.clientY), over: null })
  }

  const onResizeDown = (e: RPointerEvent, n: DiagramNode): void => {
    e.stopPropagation()
    setDragBoth({ type: 'resize', id: n.id, start: toWorld(e.clientX, e.clientY), before: dRef.current, w: n.w, h: n.h })
  }

  const onEdgeDown = (e: RPointerEvent, edge: DiagramEdge): void => {
    if (readOnly || panning || e.button !== 0) return
    e.stopPropagation()
    if (editing) finishEditing(true)
    setSel(
      e.shiftKey
        ? { nodes: sel.nodes, edges: sel.edges.includes(edge.id) ? sel.edges.filter((x) => x !== edge.id) : [...sel.edges, edge.id] }
        : { nodes: [], edges: [edge.id] }
    )
  }

  const onMove = (e: PointerEvent): void => {
    const g = dragRef.current
    if (!g) return
    if (g.type === 'pan') {
      setView({ ...g.view, x: g.view.x + e.clientX - g.start.x, y: g.view.y + e.clientY - g.start.y })
      return
    }
    const p = toWorld(e.clientX, e.clientY)
    if (g.type === 'move') {
      const dx = Math.round(p.x - g.start.x)
      const dy = Math.round(p.y - g.start.y)
      if (!g.moved && Math.abs(dx) + Math.abs(dy) < 3) return
      g.moved = true
      const next = { ...dRef.current, nodes: dRef.current.nodes.map((n) => (g.orig[n.id] ? { ...n, x: g.orig[n.id].x + dx, y: g.orig[n.id].y + dy } : n)) }
      dRef.current = next
      setD(next)
    } else if (g.type === 'resize') {
      const next = {
        ...dRef.current,
        nodes: dRef.current.nodes.map((n) =>
          n.id === g.id ? { ...n, w: Math.max(36, Math.round(g.w + p.x - g.start.x)), h: Math.max(28, Math.round(g.h + p.y - g.start.y)) } : n
        )
      }
      dRef.current = next
      setD(next)
    } else if (g.type === 'marquee') {
      const x1 = Math.min(g.start.x, p.x)
      const x2 = Math.max(g.start.x, p.x)
      const y1 = Math.min(g.start.y, p.y)
      const y2 = Math.max(g.start.y, p.y)
      const inside = dRef.current.nodes.filter((n) => n.x >= x1 && n.x + n.w <= x2 && n.y >= y1 && n.y + n.h <= y2).map((n) => n.id)
      setSel({ nodes: [...new Set([...g.base, ...inside])], edges: [] })
      setDragBoth({ ...g, cur: p })
    } else if (g.type === 'arrow') {
      const over = nodeAt(dRef.current, p)
      setDragBoth({ ...g, cur: p, over: over && over.id !== g.from ? over.id : null })
    }
  }

  const onUp = (): void => {
    const g = dragRef.current
    setDragBoth(null)
    if (!g) return
    if ((g.type === 'move' && g.moved) || g.type === 'resize') {
      commit(dRef.current, g.before)
    } else if (g.type === 'arrow') {
      if (g.over) {
        const exists = dRef.current.edges.some((e) => (e.from === g.from && e.to === g.over) || (e.both && e.from === g.over && e.to === g.from))
        if (!exists) {
          const edge: DiagramEdge = { id: newId('e'), from: g.from, to: g.over }
          commit({ ...dRef.current, edges: [...dRef.current.edges, edge] })
          setSel({ nodes: [], edges: [edge.id] })
        }
      }
      if (tool === 'arrow') setTool('select')
    }
  }

  // drags follow the pointer even outside the canvas (window listeners instead of pointer
  // capture, which would retarget clicks/double-clicks to the <svg>)
  const handlers = useRef({ onMove, onUp })
  handlers.current = { onMove, onUp }
  const dragging = drag !== null
  useEffect(() => {
    if (!dragging) return
    const move = (e: PointerEvent): void => handlers.current.onMove(e)
    const up = (): void => handlers.current.onUp()
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }, [dragging])

  // ───────── library drag & drop ─────────

  useEffect(() => {
    if (!ghost) return
    const move = (e: PointerEvent): void =>
      setGhost((gh) => gh && { ...gh, x: e.clientX, y: e.clientY, moved: gh.moved || Math.hypot(e.clientX - gh.x, e.clientY - gh.y) > 4 })
    const up = (e: PointerEvent): void => {
      const gh = ghost
      setGhost(null)
      const el = svgRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const inCanvas = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
      const wasDrag = gh.moved || Math.hypot(e.clientX - gh.x, e.clientY - gh.y) > 4
      if (wasDrag && inCanvas) {
        addNode(gh.kind, toWorld(e.clientX, e.clientY), gh.kind === 'text')
      } else if (!wasDrag) {
        // click: drop it in the middle of the view, nudged so repeated clicks don't stack
        const c = toWorld(r.left + r.width / 2, r.top + r.height / 2)
        const k = dRef.current.nodes.length % 6
        addNode(gh.kind, { x: c.x + k * 22, y: c.y + k * 22 }, gh.kind === 'text')
      }
      setTool('select')
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    // re-bind only when a drag starts/stops, not on every ghost move
  }, [ghost === null]) // eslint-disable-line react-hooks/exhaustive-deps

  // ───────── render helpers ─────────

  const byId = useMemo(() => Object.fromEntries(d.nodes.map((n) => [n.id, n])), [d.nodes])
  const selNode = sel.nodes.length === 1 && !sel.edges.length ? byId[sel.nodes[0]] : null
  const selEdge = sel.edges.length === 1 && !sel.nodes.length ? d.edges.find((e) => e.id === sel.edges[0]) : null
  const showPorts = !readOnly && !drag && (tool === 'select' || tool === 'arrow') && !panning
  const portNode = showPorts && hover ? byId[hover] : null
  const arrowFrom = drag?.type === 'arrow' ? byId[drag.from] : null
  const arrowTo = drag?.type === 'arrow' && drag.over ? byId[drag.over] : null
  const cursor = drag?.type === 'pan' ? 'grabbing' : panning ? 'grab' : tool === 'arrow' || tool === 'text' ? 'crosshair' : 'default'

  const editPos = ((): { left: number; top: number; inside: boolean } | null => {
    if (!editing) return null
    if (editing.type === 'edge') {
      const e = d.edges.find((x) => x.id === editing.id)
      const a = e && byId[e.from]
      const b = e && byId[e.to]
      if (!a || !b) return null
      const [p, q] = edgeEnds(a, b)
      return { left: ((p.x + q.x) / 2) * view.z + view.x, top: ((p.y + q.y) / 2) * view.z + view.y, inside: true }
    }
    const n = byId[editing.id]
    if (!n) return null
    if (n.kind === 'text') return { left: n.x * view.z + view.x, top: (n.y + n.h / 2) * view.z + view.y, inside: false }
    const cy = labelInside(n.kind) ? n.y + n.h / 2 : n.y + n.h + 17
    return { left: (n.x + n.w / 2) * view.z + view.x, top: cy * view.z + view.y, inside: true }
  })()

  const gridSize = 24 * view.z

  return (
    <div className={`dl-wrap ${readOnly ? 'readonly' : ''}`} ref={wrapRef}>
      <svg
        ref={svgRef}
        className="dl-svg"
        style={{ cursor }}
        onPointerDown={onCanvasDown}
        onDoubleClick={(e) => {
          if (readOnly || e.target !== svgRef.current) return
          const p = toWorld(e.clientX, e.clientY)
          addNode('text', { x: p.x + 50, y: p.y }, true)
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <defs>
          <pattern id="dl-grid" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse" x={view.x} y={view.y}>
            <circle cx={1} cy={1} r={1} className="dl-dot" />
          </pattern>
          <marker
            id="dl-head"
            viewBox="0 0 12 12"
            refX="10"
            refY="6"
            markerWidth="12"
            markerHeight="12"
            markerUnits="userSpaceOnUse"
            orient="auto-start-reverse"
          >
            <path d="M1,1.5 L10,6 L1,10.5" className="dl-head" />
          </marker>
          <marker
            id="dl-head-sel"
            viewBox="0 0 12 12"
            refX="10"
            refY="6"
            markerWidth="12"
            markerHeight="12"
            markerUnits="userSpaceOnUse"
            orient="auto-start-reverse"
          >
            <path d="M1,1.5 L10,6 L1,10.5" className="dl-head sel" />
          </marker>
        </defs>
        <rect width="100%" height="100%" fill="url(#dl-grid)" pointerEvents="none" />

        <g transform={`translate(${view.x} ${view.y}) scale(${view.z})`}>
          {/* arrows */}
          {d.edges.map((e) => {
            const a = byId[e.from]
            const b = byId[e.to]
            if (!a || !b) return null
            const [p, q] = edgeEnds(a, b)
            const isSel = sel.edges.includes(e.id)
            const mid = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }
            const m = isSel ? 'url(#dl-head-sel)' : 'url(#dl-head)'
            return (
              <g key={e.id} className={`dl-edge ${isSel ? 'sel' : ''}`}>
                <line
                  x1={p.x}
                  y1={p.y}
                  x2={q.x}
                  y2={q.y}
                  className="dl-edge-hit"
                  onPointerDown={(ev) => onEdgeDown(ev, e)}
                  onDoubleClick={(ev) => {
                    if (readOnly) return
                    ev.stopPropagation()
                    setEditing({ type: 'edge', id: e.id, value: e.label ?? '' })
                  }}
                />
                <line
                  x1={p.x}
                  y1={p.y}
                  x2={q.x}
                  y2={q.y}
                  className={`dl-edge-line ${e.dashed ? 'dashed' : ''}`}
                  markerEnd={m}
                  markerStart={e.both ? m : undefined}
                />
                {e.label && !(editing?.type === 'edge' && editing.id === e.id) && (
                  <g transform={`translate(${mid.x} ${mid.y})`} pointerEvents="none">
                    <rect x={-(e.label.length * 3.4 + 7)} y={-10} width={e.label.length * 6.8 + 14} height={20} rx={4} className="dl-edge-label-bg" />
                    <text className="dl-edge-label" textAnchor="middle" dy="0.35em">
                      {e.label}
                    </text>
                  </g>
                )}
              </g>
            )
          })}

          {/* arrow being drawn */}
          {arrowFrom && drag?.type === 'arrow' && (
            <line
              {...((): { x1: number; y1: number; x2: number; y2: number } => {
                const [p, q] = arrowTo ? edgeEnds(arrowFrom, arrowTo) : [clip(arrowFrom, drag.cur), drag.cur]
                return { x1: p.x, y1: p.y, x2: q.x, y2: q.y }
              })()}
              className="dl-edge-line drawing"
              markerEnd="url(#dl-head-sel)"
            />
          )}

          {/* shapes */}
          {d.nodes.map((n) => {
            const isSel = sel.nodes.includes(n.id)
            const isEditing = editing?.type === 'node' && editing.id === n.id
            return (
              <g
                key={n.id}
                className={`dl-node k-${n.kind} ${isSel ? 'sel' : ''} ${arrowTo?.id === n.id ? 'target' : ''} ${isEditing ? 'editing' : ''}`}
                transform={`translate(${n.x} ${n.y})`}
                onPointerDown={(e) => onNodeDown(e, n)}
                onPointerEnter={() => setHover(n.id)}
                onPointerLeave={() => setHover((h) => (h === n.id ? null : h))}
                onDoubleClick={(e) => {
                  if (readOnly) return
                  e.stopPropagation()
                  setEditing({ type: 'node', id: n.id, value: n.label })
                }}
              >
                {/* generous invisible hit area so thin shapes are easy to grab */}
                <rect x={-8} y={-8} width={n.w + 16} height={n.h + (labelInside(n.kind) ? 16 : 34)} className="dl-hit" />
                <ShapeNode node={n} />
                {isSel && <rect x={-6} y={-6} width={n.w + 12} height={n.h + 12} rx={4} className="dl-sel-box" />}
                {arrowTo?.id === n.id && <rect x={-6} y={-6} width={n.w + 12} height={n.h + 12} rx={6} className="dl-target-box" />}
              </g>
            )
          })}

          {/* connection dots on the hovered shape */}
          {portNode &&
            portNode.kind !== 'text' &&
            [
              [portNode.w / 2, -12],
              [portNode.w + 12, portNode.h / 2],
              [portNode.w / 2, portNode.h + 12],
              [-12, portNode.h / 2]
            ].map(([px, py], i) => (
              <circle
                key={i}
                cx={portNode.x + px}
                cy={portNode.y + py}
                r={6}
                className="dl-port"
                onPointerDown={(e) => onPortDown(e, portNode)}
                onPointerEnter={() => setHover(portNode.id)}
                onPointerLeave={() => setHover((h) => (h === portNode.id ? null : h))}
              >
                <title>Drag to connect</title>
              </circle>
            ))}

          {/* resize handle */}
          {selNode && !readOnly && selNode.kind !== 'text' && !drag && (
            <rect
              x={selNode.x + selNode.w + 2}
              y={selNode.y + selNode.h + 2}
              width={9}
              height={9}
              rx={2}
              className="dl-resize"
              onPointerDown={(e) => onResizeDown(e, selNode)}
            />
          )}

          {/* marquee */}
          {drag?.type === 'marquee' && (
            <rect
              x={Math.min(drag.start.x, drag.cur.x)}
              y={Math.min(drag.start.y, drag.cur.y)}
              width={Math.abs(drag.cur.x - drag.start.x)}
              height={Math.abs(drag.cur.y - drag.start.y)}
              className="dl-marquee"
            />
          )}
        </g>
      </svg>

      {/* inline label editor */}
      {editing && editPos && (
        <input
          className={`dl-edit ${editPos.inside ? 'centered' : ''}`}
          style={{ left: editPos.left, top: editPos.top, fontSize: 13 * view.z }}
          autoFocus
          value={editing.value}
          placeholder={editing.type === 'edge' ? 'label, e.g. async' : 'Type…'}
          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') finishEditing(true)
            if (e.key === 'Escape') finishEditing(false)
            e.stopPropagation()
          }}
          onBlur={() => finishEditing(true)}
        />
      )}

      {!d.nodes.length && !readOnly && (
        <div className="dl-empty">
          <Icon name="pen-tool" size={22} />
          <b>Drag shapes from the library onto the canvas</b>
          <span>
            Connect them by dragging from the dots on a shape&apos;s edge, or press <kbd>A</kbd> for the arrow tool.
          </span>
        </div>
      )}

      {/* ── toolbar ── */}
      {!readOnly && (
        <div className="dl-island dl-toolbar" role="toolbar" aria-label="Canvas tools">
          {TOOLS.map((t) => (
            <button
              key={t.tool}
              className={`dl-tool ${tool === t.tool ? 'on' : ''}`}
              onClick={() => setTool(t.tool)}
              title={`${t.label} (${t.key})`}
              aria-pressed={tool === t.tool}
            >
              <Icon name={t.icon} size={17} />
              <span className="dl-key">{t.key}</span>
            </button>
          ))}
          <span className="dl-sep" />
          <button className="dl-tool" onClick={undo} disabled={!past.current.length} title="Undo (Ctrl+Z)">
            <Icon name="undo" size={17} />
          </button>
          <button className="dl-tool" onClick={redo} disabled={!future.current.length} title="Redo (Ctrl+Shift+Z)">
            <Icon name="redo" size={17} />
          </button>
          <button
            className="dl-tool"
            onClick={() => {
              if (!d.nodes.length) return
              commit({ nodes: [], edges: [] })
              setSel(NONE)
            }}
            disabled={!d.nodes.length}
            title="Clear canvas (undo with Ctrl+Z)"
          >
            <Icon name="trash" size={17} />
          </button>
        </div>
      )}

      {/* ── shape library ── */}
      {!readOnly && (
        <div className={`dl-island dl-library ${libOpen ? '' : 'closed'}`}>
          <button className="dl-lib-head" onClick={() => setLibOpen((o) => !o)} aria-expanded={libOpen}>
            <Icon name="shapes" size={15} /> Shapes
            <Icon name={libOpen ? 'chevron-left' : 'chevron-right'} size={14} />
          </button>
          {libOpen && (
            <div className="dl-lib-body">
              {SHAPE_GROUPS.map((g) => (
                <div key={g} className="dl-lib-group">
                  <div className="dl-lib-title">{g}</div>
                  <div className="dl-lib-grid">
                    {KINDS.filter((k) => k.group === g).map((k) => (
                      <button
                        key={k.kind}
                        className="dl-lib-item"
                        title={`${k.name}: ${k.blurb}`}
                        onPointerDown={(e) => {
                          if (e.button !== 0) return
                          e.preventDefault()
                          setGhost({ kind: k.kind, x: e.clientX, y: e.clientY, moved: false })
                        }}
                      >
                        <ShapeIcon kind={k.kind} />
                        <span>{k.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── properties of the selection ── */}
      {!readOnly && (selNode || selEdge || sel.nodes.length + sel.edges.length > 1) && !drag && (
        <div className="dl-island dl-props">
          {selNode && (
            <>
              <div className="dl-props-title">{KIND[selNode.kind].name}</div>
              <label className="dl-field">
                <span>{selNode.kind === 'text' ? 'Text' : 'Label'}</span>
                <input
                  key={selNode.id + selNode.label}
                  defaultValue={selNode.label}
                  onKeyDown={(e) => {
                    e.stopPropagation()
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                  }}
                  onBlur={(e) => {
                    const v = e.target.value.trim()
                    if (v !== selNode.label && (v || selNode.kind !== 'text'))
                      updateNode(selNode.id, { label: v, ...(selNode.kind === 'text' ? { w: textWidth(v) } : {}) })
                  }}
                />
              </label>
              {canScale(selNode.kind) && (
                <div className="dl-field">
                  <span>Copies running</span>
                  <div className="dl-stepper">
                    <button
                      onClick={() => updateNode(selNode.id, { count: Math.max(1, (selNode.count ?? 1) - 1) })}
                      disabled={(selNode.count ?? 1) <= 1}
                      aria-label="Fewer copies"
                    >
                      −
                    </button>
                    <b>×{selNode.count ?? 1}</b>
                    <button
                      onClick={() => updateNode(selNode.id, { count: Math.min(9, (selNode.count ?? 1) + 1) })}
                      disabled={(selNode.count ?? 1) >= 9}
                      aria-label="More copies"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
              <p className="dl-props-hint">{KIND[selNode.kind].blurb}</p>
            </>
          )}
          {selEdge && (
            <>
              <div className="dl-props-title">Arrow</div>
              <label className="dl-field">
                <span>Label</span>
                <input
                  key={selEdge.id + (selEdge.label ?? '')}
                  defaultValue={selEdge.label ?? ''}
                  placeholder="e.g. reads, async"
                  onKeyDown={(e) => {
                    e.stopPropagation()
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                  }}
                  onBlur={(e) => {
                    const v = e.target.value.trim()
                    if (v !== (selEdge.label ?? '')) updateEdge(selEdge.id, { label: v || undefined })
                  }}
                />
              </label>
              <div className="dl-chips">
                <button className={`dl-chip ${!selEdge.dashed ? 'on' : ''}`} onClick={() => updateEdge(selEdge.id, { dashed: false })}>
                  Solid
                </button>
                <button
                  className={`dl-chip ${selEdge.dashed ? 'on' : ''}`}
                  onClick={() => updateEdge(selEdge.id, { dashed: true })}
                  title="Dashed: async / background"
                >
                  Dashed
                </button>
              </div>
              <div className="dl-chips">
                <button className={`dl-chip ${!selEdge.both ? 'on' : ''}`} onClick={() => updateEdge(selEdge.id, { both: false })}>
                  One-way
                </button>
                <button className={`dl-chip ${selEdge.both ? 'on' : ''}`} onClick={() => updateEdge(selEdge.id, { both: true })}>
                  Two-way
                </button>
                <button className="dl-chip" onClick={() => updateEdge(selEdge.id, { from: selEdge.to, to: selEdge.from })} title="Reverse direction">
                  <Icon name="repeat" size={12} /> Flip
                </button>
              </div>
            </>
          )}
          {!selNode && !selEdge && <div className="dl-props-title">{sel.nodes.length + sel.edges.length} selected</div>}
          <div className="dl-props-actions">
            {sel.nodes.length > 0 && (
              <button className="dl-chip" onClick={duplicateSelection} title="Duplicate (Ctrl+D)">
                <Icon name="copy" size={12} /> Duplicate
              </button>
            )}
            <button className="dl-chip danger" onClick={deleteSelection} title="Delete (Del)">
              <Icon name="trash" size={12} /> Delete
            </button>
          </div>
        </div>
      )}

      {/* ── zoom ── */}
      <div className="dl-island dl-zoom">
        <button className="dl-tool" onClick={() => zoomAt(1 / 1.2)} title="Zoom out (Ctrl −)" aria-label="Zoom out">
          <Icon name="minus" size={15} />
        </button>
        <button className="dl-zoom-pct" onClick={() => fit()} title="Fit to screen (Ctrl+0)">
          {Math.round(view.z * 100)}%
        </button>
        <button className="dl-tool" onClick={() => zoomAt(1.2)} title="Zoom in (Ctrl +)" aria-label="Zoom in">
          <Icon name="plus" size={15} />
        </button>
      </div>

      {/* drag ghost from the library */}
      {ghost && ghost.moved && (
        <div className="dl-ghost" style={{ left: ghost.x, top: ghost.y }}>
          <ShapeIcon kind={ghost.kind} size={64} />
        </div>
      )}
    </div>
  )
}
