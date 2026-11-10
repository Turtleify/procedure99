import type { Diagram, DiagramNode, ShapeKind } from '../../../shared/types'

// ───────── Shape catalogue ─────────

export type ShapeGroup = 'Clients' | 'Network' | 'Compute' | 'Data' | 'Messaging' | 'Annotate'

export interface KindMeta {
  kind: ShapeKind
  name: string
  group: ShapeGroup
  /** default size of the shape itself (the label sits underneath) */
  w: number
  h: number
  /** one line shown in the shape library tooltip */
  blurb: string
}

export const KINDS: KindMeta[] = [
  { kind: 'client', name: 'Web Client', group: 'Clients', w: 112, h: 80, blurb: 'A browser: where requests start' },
  { kind: 'mobile', name: 'Mobile App', group: 'Clients', w: 56, h: 92, blurb: 'A phone app: also a client' },
  { kind: 'dns', name: 'DNS', group: 'Network', w: 76, h: 76, blurb: 'Turns a domain name into an IP address' },
  { kind: 'cdn', name: 'CDN', group: 'Network', w: 124, h: 78, blurb: 'Edge servers that cache files near users' },
  { kind: 'lb', name: 'Load Balancer', group: 'Network', w: 82, h: 82, blurb: 'Spreads requests across servers, skips dead ones' },
  { kind: 'gateway', name: 'API Gateway', group: 'Network', w: 112, h: 76, blurb: 'One front door that routes to many services' },
  { kind: 'server', name: 'App Server', group: 'Compute', w: 84, h: 96, blurb: 'Runs your application code' },
  { kind: 'service', name: 'Microservice', group: 'Compute', w: 104, h: 90, blurb: 'One independently deployed service' },
  { kind: 'worker', name: 'Worker', group: 'Compute', w: 96, h: 80, blurb: 'Does slow jobs in the background' },
  { kind: 'cache', name: 'Cache', group: 'Data', w: 104, h: 66, blurb: 'In-memory store for hot reads (e.g. Redis)' },
  { kind: 'sql', name: 'SQL Database', group: 'Data', w: 86, h: 100, blurb: 'Relational tables, transactions (e.g. Postgres)' },
  { kind: 'nosql', name: 'NoSQL Database', group: 'Data', w: 86, h: 100, blurb: 'Key-value / document / wide-column store' },
  { kind: 'storage', name: 'Object Storage', group: 'Data', w: 96, h: 92, blurb: 'Files and blobs: images, video (e.g. S3)' },
  { kind: 'search', name: 'Search Index', group: 'Data', w: 104, h: 78, blurb: 'Full-text search (e.g. Elasticsearch)' },
  { kind: 'queue', name: 'Message Queue', group: 'Messaging', w: 148, h: 58, blurb: 'Holds jobs until a worker picks them up' },
  { kind: 'rect', name: 'Box', group: 'Annotate', w: 180, h: 110, blurb: 'Group things or sketch freely' },
  { kind: 'text', name: 'Text', group: 'Annotate', w: 120, h: 28, blurb: 'A note on the canvas' }
]

export const KIND: Record<ShapeKind, KindMeta> = Object.fromEntries(KINDS.map((k) => [k.kind, k])) as Record<ShapeKind, KindMeta>
export const SHAPE_GROUPS: ShapeGroup[] = ['Clients', 'Network', 'Compute', 'Data', 'Messaging', 'Annotate']

/** Annotation shapes are ignored by the checker. */
export const isAnnotation = (k: ShapeKind): boolean => k === 'rect' || k === 'text'
/** Shapes where "how many copies run" makes sense. */
export const canScale = (k: ShapeKind): boolean => !isAnnotation(k) && k !== 'client' && k !== 'mobile' && k !== 'dns'

// role groups used by problem checks
export const CLIENTS: ShapeKind[] = ['client', 'mobile']
export const APPS: ShapeKind[] = ['server', 'service']
export const DBS: ShapeKind[] = ['sql', 'nosql']

// ───────── Graph ─────────

export interface Graph {
  nodes: DiagramNode[]
  byId: Record<string, DiagramNode>
  /** directed adjacency (two-way arrows appear in both directions) */
  out: Record<string, string[]>
}

export function buildGraph(d: Diagram): Graph {
  const nodes = d.nodes.filter((n) => !isAnnotation(n.kind))
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]))
  const out: Record<string, string[]> = Object.fromEntries(nodes.map((n) => [n.id, []]))
  for (const e of d.edges) {
    if (!byId[e.from] || !byId[e.to] || e.from === e.to) continue
    out[e.from].push(e.to)
    if (e.both) out[e.to].push(e.from)
  }
  return { nodes, byId, out }
}

export const nodesOf = (g: Graph, kinds: ShapeKind[]): DiagramNode[] => g.nodes.filter((n) => kinds.includes(n.kind))
const of = nodesOf

/** Total running copies of these kinds (a node with count 3 is 3 copies). */
export function instances(g: Graph, kinds: ShapeKind[]): number {
  return of(g, kinds).reduce((sum, n) => sum + Math.max(1, n.count ?? 1), 0)
}

/** Nodes reachable from `from` in one or more steps. */
function reach(g: Graph, from: string[]): Set<string> {
  const seen = new Set<string>()
  const stack = from.flatMap((id) => g.out[id] ?? [])
  while (stack.length) {
    const id = stack.pop()!
    if (seen.has(id)) continue
    seen.add(id)
    stack.push(...(g.out[id] ?? []))
  }
  return seen
}

/** A direct arrow from one of `a` to one of `b`. */
export function hasEdge(g: Graph, a: ShapeKind[], b: ShapeKind[]): boolean {
  return of(g, a).some((n) => g.out[n.id].some((t) => b.includes(g.byId[t].kind)))
}

/** Requests can flow through these kinds in this order (other boxes in between are fine). */
export function hasPath(g: Graph, ...stages: ShapeKind[][]): boolean {
  let frontier = of(g, stages[0]).map((n) => n.id)
  for (const kinds of stages.slice(1)) {
    if (!frontier.length) return false
    frontier = [...reach(g, frontier)].filter((id) => kinds.includes(g.byId[id].kind))
  }
  return frontier.length > 0
}

/** Every node of kind `a` can reach some node of kind `b` (and there is at least one `a`). */
export function everyReaches(g: Graph, a: ShapeKind[], b: ShapeKind[]): boolean {
  const from = of(g, a)
  return from.length > 0 && from.every((n) => [...reach(g, [n.id])].some((id) => b.includes(g.byId[id].kind)))
}

/** Direct arrows from a node to nodes of these kinds. */
export const targets = (g: Graph, id: string, kinds: ShapeKind[]): DiagramNode[] =>
  [...new Set(g.out[id])].map((t) => g.byId[t]).filter((n) => kinds.includes(n.kind))

/** Every (non-annotation) shape is attached to the rest of the design. */
export function allConnected(g: Graph): boolean {
  if (g.nodes.length < 2) return g.nodes.length === 1
  const und: Record<string, string[]> = Object.fromEntries(g.nodes.map((n) => [n.id, []]))
  for (const [a, outs] of Object.entries(g.out))
    for (const b of outs) {
      und[a].push(b)
      und[b].push(a)
    }
  const seen = new Set<string>([g.nodes[0].id])
  const stack = [g.nodes[0].id]
  while (stack.length) for (const n of und[stack.pop()!]) if (!seen.has(n)) (seen.add(n), stack.push(n))
  return seen.size === g.nodes.length
}

/** A database has a copy: drawn with ×2+ or with an arrow to another database. */
export function dbReplicated(g: Graph, kinds: ShapeKind[] = DBS): boolean {
  const dbs = of(g, kinds)
  return dbs.some((n) => (n.count ?? 1) >= 2) || dbs.some((n) => g.out[n.id].some((t) => kinds.includes(g.byId[t].kind)))
}

// ───────── Checks ─────────

export interface Check {
  /** shown like a test-case name */
  label: string
  /** shown when it fails */
  hint: string
  test: (g: Graph) => boolean
}

export interface CheckResult {
  label: string
  hint: string
  pass: boolean
}

export const CONNECTED_CHECK: Check = {
  label: 'Every component is wired into the design',
  hint: 'A box with no arrows does nothing. Connect it or delete it.',
  test: allConnected
}

export function grade(d: Diagram, checks: Check[]): CheckResult[] {
  const g = buildGraph(d)
  return [...checks, CONNECTED_CHECK].map((c) => ({ label: c.label, hint: c.hint, pass: g.nodes.length > 0 && c.test(g) }))
}

// ───────── Reference-design builder ─────────

/** [id, kind, column, row, label?, count?] on a 190×175 grid */
export type RefNode = [string, ShapeKind, number, number, string?, number?]
/** [from, to, options?] */
export type RefEdge = [string, string, { label?: string; both?: boolean; dashed?: boolean }?]

export function layoutDiagram(nodes: RefNode[], edges: RefEdge[]): Diagram {
  return {
    nodes: nodes.map(([id, kind, col, row, label, count]) => {
      const m = KIND[kind]
      return {
        id,
        kind,
        x: 60 + col * 190 + (120 - m.w) / 2,
        y: 60 + row * 175 + (100 - m.h) / 2,
        w: m.w,
        h: m.h,
        label: label ?? m.name,
        ...(count && count > 1 ? { count } : {})
      }
    }),
    edges: edges.map(([from, to, o], i) => ({ id: `e${i}`, from, to, ...o }))
  }
}
