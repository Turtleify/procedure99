import { describe, expect, it } from 'vitest'
import { CURRICULUM } from '../src/renderer/src/content/curriculum'
import { SCENARIOS } from '../src/renderer/src/content/scenarios'
import { COMPARISONS, TOOLS } from '../src/renderer/src/content/tools'
import { TOOL_TRACK } from '../src/renderer/src/content/tools-track'

const unitIds = new Set(CURRICULUM.map((u) => u.id))
const ALL_UNITS = [...CURRICULUM, ...TOOL_TRACK]

describe('curriculum', () => {
  it('has unique lesson ids (across both tracks)', () => {
    const ids = ALL_UNITS.flatMap((u) => u.lessons.map((l) => l.id))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every quiz answer index is in range and options are unique', () => {
    for (const u of ALL_UNITS)
      for (const l of u.lessons) {
        if (l.type !== 'lesson') continue
        expect(l.cards.length, l.id).toBeGreaterThan(0)
        expect(l.quiz.length, l.id).toBeGreaterThan(0)
        for (const q of l.quiz) {
          expect(q.answer, `${l.id}: ${q.q}`).toBeGreaterThanOrEqual(0)
          expect(q.answer, `${l.id}: ${q.q}`).toBeLessThan(q.options.length)
          expect(new Set(q.options).size, `${l.id}: ${q.q}`).toBe(q.options.length)
          expect(q.options.length).toBeLessThanOrEqual(4) // hotkeys 1-4
        }
      }
  })

  it('bytes and labs are well-formed', () => {
    for (const u of ALL_UNITS)
      for (const l of u.lessons) {
        if (l.type === 'byte') expect(l.points.length, l.id).toBeGreaterThan(2)
        if (l.type === 'lab') expect(l.steps.length, l.id).toBeGreaterThan(2)
      }
  })
})

describe('tools track', () => {
  const toolIds = new Set(TOOLS.map((t) => t.id))

  it('modules have unique ids, valid requirements and real Toolbox ids', () => {
    const ids = TOOL_TRACK.map((u) => u.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const u of TOOL_TRACK) {
      expect(u.track, u.id).toBe('tools')
      expect(u.requires?.length, `${u.id}: requires`).toBeGreaterThan(0)
      for (const r of u.requires ?? []) expect(unitIds.has(r), `${u.id}: requires ${r}`).toBe(true)
      expect(u.teaches?.length, `${u.id}: teaches`).toBeGreaterThan(0)
      for (const t of u.teaches ?? []) expect(toolIds.has(t), `${u.id}: teaches ${t}`).toBe(true)
    }
  })

  it('each module is 2–4 lessons plus a closing Interview Byte, with snippet questions', () => {
    for (const u of TOOL_TRACK) {
      const lessons = u.lessons.filter((l) => l.type === 'lesson')
      expect(lessons.length, u.id).toBeGreaterThanOrEqual(2)
      expect(lessons.length, u.id).toBeLessThanOrEqual(4)
      expect(u.lessons[u.lessons.length - 1].type, `${u.id}: last lesson`).toBe('byte')
      const snippets = lessons.flatMap((l) => (l.type === 'lesson' ? l.quiz : [])).filter((q) => q.code)
      expect(snippets.length, `${u.id}: code questions`).toBeGreaterThanOrEqual(3)
      for (const l of lessons) if (l.type === 'lesson') expect(l.quiz.every((q) => q.options.length === 4), l.id).toBe(true)
    }
  })
})

describe('scenarios', () => {
  it('each has exactly one correct option, max 4 options, and a valid unit', () => {
    for (const s of SCENARIOS) {
      expect(s.options.filter((o) => o.correct).length, s.id).toBe(1)
      expect(s.options.length, s.id).toBeLessThanOrEqual(4)
      expect(unitIds.has(s.unit), s.id).toBe(true)
    }
  })

  it('have unique ids and the first unit has scenarios (so the daily incident works on day 1)', () => {
    expect(new Set(SCENARIOS.map((s) => s.id)).size).toBe(SCENARIOS.length)
    expect(SCENARIOS.some((s) => s.unit === CURRICULUM[0].id)).toBe(true)
  })
})

describe('icons', () => {
  it('every icon key used in content resolves to a real icon', async () => {
    const { hasIcon } = await import('../src/renderer/src/components/Icon')
    const { ACHIEVEMENTS } = await import('../src/renderer/src/lib/achievements')
    const { QUEST_ICON } = await import('../src/renderer/src/lib/quests')
    const keys = [
      ...CURRICULUM.map((u) => u.icon),
      ...TOOLS.map((t) => t.icon),
      ...ACHIEVEMENTS.map((a) => a.icon),
      ...Object.values(QUEST_ICON),
      'snowflake', 'heart-crack', 'gift', 'flame', 'chevrons-up', 'swords'
    ]
    for (const k of keys) expect(hasIcon(k), k).toBe(true)
  }, 30_000) // first import of the icon library is slow on a cold cache
})

describe('tools', () => {
  it('reference real units and have unique ids', () => {
    for (const t of TOOLS) expect(unitIds.has(t.unit), t.id).toBe(true)
    for (const c of COMPARISONS) {
      expect(unitIds.has(c.unit), c.id).toBe(true)
      for (const r of c.rows) expect(r.length, c.id).toBe(c.columns.length)
    }
    expect(new Set(TOOLS.map((t) => t.id)).size).toBe(TOOLS.length)
  })

  it('are complete encyclopedia entries', async () => {
    const { CATEGORY_BY_NAME } = await import('../src/renderer/src/content/toolbox/categories')
    for (const t of TOOLS) {
      expect(CATEGORY_BY_NAME[t.category], `${t.id}: category "${t.category}"`).toBeTruthy()
      for (const u of t.alsoIn ?? []) expect(unitIds.has(u), `${t.id}: alsoIn ${u}`).toBe(true)
      expect(t.summary.length, `${t.id}: summary`).toBeGreaterThan(60)
      expect(t.tagline.length, `${t.id}: tagline`).toBeLessThanOrEqual(80)
      expect(t.strengths.length, `${t.id}: strengths`).toBeGreaterThanOrEqual(2)
      expect(t.weaknesses.length, `${t.id}: weaknesses`).toBeGreaterThanOrEqual(2)
      expect(t.useWhen.length, `${t.id}: useWhen`).toBeGreaterThanOrEqual(1)
      expect(t.avoidWhen.length, `${t.id}: avoidWhen`).toBeGreaterThanOrEqual(1)
      expect(t.alternatives.length, `${t.id}: alternatives`).toBeGreaterThanOrEqual(1)
    }
    // names should be unique too, or search results get confusing
    expect(new Set(TOOLS.map((t) => t.name.toLowerCase())).size).toBe(TOOLS.length)
  })

  it('every unit has tools in the Toolbox', () => {
    for (const id of unitIds) {
      const n = TOOLS.filter((t) => t.unit === id || t.alsoIn?.includes(id)).length
      expect(n, id).toBeGreaterThanOrEqual(5)
    }
  })
})

describe('skill tree', () => {
  it('places every unit and module exactly once, inside the canvas', async () => {
    const { PLACEMENTS, TREE_VIEWBOX } = await import('../src/renderer/src/content/skilltree')
    const ids = ALL_UNITS.map((u) => u.id)
    for (const id of ids) {
      const p = PLACEMENTS[id]
      expect(p, `${id} has no placement`).toBeTruthy()
      expect(p.x > 0 && p.x < TREE_VIEWBOX.width && p.y > 0 && p.y < TREE_VIEWBOX.height, `${id} off canvas`).toBe(true)
    }
    for (const id of Object.keys(PLACEMENTS)) expect(ids.includes(id), `${id} placed but not a unit/module`).toBe(true)
  })

  it('modules grow from the unit that actually unlocks them', async () => {
    const { NODE_BY_ID } = await import('../src/renderer/src/lib/skilltree')
    expect(NODE_BY_ID.t6.parent).toBe('u6') // requires u5 + u6 → gated by u6
    expect(NODE_BY_ID.t10.parent).toBe('u8') // requires u3 + u8 → gated by u8
    expect(NODE_BY_ID.t3.parent).toBe('u4') // orchestration needs load balancing first
    expect(NODE_BY_ID.u1.parent).toBeNull()
    expect(NODE_BY_ID.u2.parent).toBe('u1')
  })
})
