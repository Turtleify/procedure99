import { describe, expect, it } from 'vitest'
import { CURRICULUM } from '../src/renderer/src/content/curriculum'
import { SCENARIOS } from '../src/renderer/src/content/scenarios'
import { COMPARISONS, TOOLS } from '../src/renderer/src/content/tools'

const unitIds = new Set(CURRICULUM.map((u) => u.id))

describe('curriculum', () => {
  it('has unique lesson ids', () => {
    const ids = CURRICULUM.flatMap((u) => u.lessons.map((l) => l.id))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every quiz answer index is in range and options are unique', () => {
    for (const u of CURRICULUM)
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
    for (const u of CURRICULUM)
      for (const l of u.lessons) {
        if (l.type === 'byte') expect(l.points.length, l.id).toBeGreaterThan(2)
        if (l.type === 'lab') expect(l.steps.length, l.id).toBeGreaterThan(2)
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
  })
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
})
