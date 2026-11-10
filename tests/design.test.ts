import { describe, expect, it } from 'vitest'
import { DESIGN_PROBLEMS, PROBLEM_BY_ID } from '../src/renderer/src/content/design-problems'
import { buildGraph, dbReplicated, grade, hasPath, instances, KIND, layoutDiagram } from '../src/renderer/src/lib/design'
import { UNIT_INDEX } from '../src/renderer/src/lib/progress'

describe('design lab content', () => {
  it('has unique ids, valid units and shapes', () => {
    const ids = DESIGN_PROBLEMS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const p of DESIGN_PROBLEMS) {
      for (const u of p.units) expect(UNIT_INDEX[u], `${p.id}: ${u}`).toBeDefined()
      for (const n of p.reference.nodes) expect(KIND[n.kind], `${p.id}: ${n.kind}`).toBeDefined()
      for (const e of p.reference.edges) {
        expect(
          p.reference.nodes.some((n) => n.id === e.from),
          `${p.id}: ${e.from}`
        ).toBe(true)
        expect(
          p.reference.nodes.some((n) => n.id === e.to),
          `${p.id}: ${e.to}`
        ).toBe(true)
      }
    }
  })

  it('every reference design passes all of its own checks', () => {
    for (const p of DESIGN_PROBLEMS) {
      const failed = grade(p.reference, p.checks).filter((c) => !c.pass)
      expect(
        failed.map((c) => c.label),
        p.id
      ).toEqual([])
    }
  })

  it('an empty canvas passes nothing', () => {
    for (const p of DESIGN_PROBLEMS)
      expect(
        grade({ nodes: [], edges: [] }, p.checks).some((c) => c.pass),
        p.id
      ).toBe(false)
  })

  it('every problem is reachable at every difficulty', () => {
    for (const d of ['Easy', 'Medium', 'Hard']) expect(DESIGN_PROBLEMS.some((p) => p.difficulty === d)).toBe(true)
  })
})

describe('design checker', () => {
  it('follows paths through other boxes, and two-way arrows both ways', () => {
    const d = layoutDiagram(
      [
        ['c', 'client', 0, 0],
        ['lb', 'lb', 1, 0],
        ['app', 'server', 2, 0, undefined, 3],
        ['q', 'queue', 3, 0]
      ],
      [
        ['c', 'lb'],
        ['lb', 'app'],
        ['app', 'q', { both: true }]
      ]
    )
    const g = buildGraph(d)
    expect(hasPath(g, ['client'], ['server'])).toBe(true)
    expect(hasPath(g, ['server'], ['client'])).toBe(false)
    expect(hasPath(g, ['queue'], ['server'])).toBe(true)
    expect(instances(g, ['server'])).toBe(3)
  })

  it('a single server design fails the crash problem with useful messages', () => {
    const p = PROBLEM_BY_ID['server-crash']
    const d = layoutDiagram(
      [
        ['c', 'client', 0, 0],
        ['app', 'server', 1, 0],
        ['db', 'sql', 2, 0]
      ],
      [
        ['c', 'app'],
        ['app', 'db']
      ]
    )
    const failed = grade(d, p.checks).filter((c) => !c.pass)
    expect(failed.map((c) => c.label)).toEqual(['Traffic is load-balanced across 2+ app servers', 'Clients don’t connect straight to a server'])
  })

  it('counts replicas drawn as ×N or as a database-to-database arrow', () => {
    const one = buildGraph(layoutDiagram([['db', 'sql', 0, 0]], []))
    const counted = buildGraph(layoutDiagram([['db', 'sql', 0, 0, undefined, 2]], []))
    const arrow = buildGraph(
      layoutDiagram(
        [
          ['db', 'sql', 0, 0],
          ['r', 'sql', 1, 0]
        ],
        [['db', 'r']]
      )
    )
    expect(dbReplicated(one)).toBe(false)
    expect(dbReplicated(counted)).toBe(true)
    expect(dbReplicated(arrow)).toBe(true)
  })

  it('ignores notes and boxes, and flags disconnected components', () => {
    const p = PROBLEM_BY_ID.blog
    const d = structuredClone(p.reference)
    d.nodes.push({ id: 'note', kind: 'text', x: 0, y: 0, w: 80, h: 28, label: 'hello' })
    expect(grade(d, p.checks).every((c) => c.pass)).toBe(true)
    d.nodes.push({ id: 'stray', kind: 'cache', x: 0, y: 0, w: 100, h: 60, label: 'Cache' })
    expect(grade(d, p.checks).find((c) => !c.pass)?.label).toBe('Every component is wired into the design')
  })
})
