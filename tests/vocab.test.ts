import { describe, expect, it } from 'vitest'
import { CURRICULUM } from '../src/renderer/src/content/curriculum'
import { TOOL_TRACK } from '../src/renderer/src/content/tools-track'
import { TERMS } from '../src/renderer/src/content/vocab-terms'
import {
  checkTyped,
  DECKS,
  deckItems,
  distractors,
  maskNames,
  nameVariants,
  normalize,
  VOCAB,
  VOCAB_BY_ID
} from '../src/renderer/src/lib/vocab'

const escapeRe = (x: string): string => x.replace(/[.*+?^$(){}|[\]\\/]/g, '\\$&')

const unitIds = new Set([...CURRICULUM, ...TOOL_TRACK].map((u) => u.id))

describe('vocab decks', () => {
  it('ids are unique', () => {
    expect(new Set(VOCAB.map((v) => v.id)).size).toBe(VOCAB.length)
    expect(new Set(TERMS.map((t) => t.id)).size).toBe(TERMS.length)
  })

  it('every deck has enough cards for 3 distractors', () => {
    for (const d of DECKS) expect(deckItems(d.id).length, d.id).toBeGreaterThan(20)
  })

  it('terms point at real units', () => {
    for (const t of TERMS) expect(unitIds.has(t.unit), `${t.id}: ${t.unit}`).toBe(true)
  })

  it('no clue gives its own answer away', () => {
    for (const v of VOCAB) {
      const clue = normalize(`${v.clue} ${v.hint ?? ''}`)
      const words = `${v.clue} ${v.hint ?? ''}`.toLowerCase()
      for (const a of v.answers) {
        if (v.deck === 'acronyms') continue // the clue *is* the expansion
        // multi-word answers: the whole phrase must not appear
        const re = new RegExp('(?<![\\w])' + escapeRe(a.toLowerCase()) + '(?![\\w])')
        expect(re.test(words), `${v.id} clue contains "${a}": ${v.clue}`).toBe(false)
      }
      expect(clue.length, v.id).toBeGreaterThan(3)
    }
  })

  it('distractors are distinct and never the answer', () => {
    for (const v of VOCAB) {
      const names = distractors(v, deckItems(v.deck), (x) => x.name)
      expect(names.length, v.id).toBe(3)
      const texts = new Set([v.name.toLowerCase(), ...names.map((n) => n.name.toLowerCase())])
      expect(texts.size, v.id).toBe(4)
    }
  })
})

describe('tool name masking', () => {
  it('finds the short forms of a name', () => {
    expect(nameVariants('Amazon SQS')).toContain('SQS')
    expect(nameVariants('Trino / Presto')).toEqual(expect.arrayContaining(['Trino', 'Presto']))
    expect(nameVariants('PostgreSQL')).toContain('Postgres')
  })

  it('blanks the name and its acronym gloss', () => {
    expect(maskNames('Amazon SQS (Simple Queue Service) is a managed queue.', nameVariants('Amazon SQS'))).toBe('It is a managed queue.')
    expect(maskNames('Pairs well with SQS.', nameVariants('Amazon SQS'))).toBe('Pairs well with ____.')
  })
})

describe('typed answers', () => {
  const redis = VOCAB_BY_ID['v:tool:redis']
  const cdn = VOCAB_BY_ID['v:acr:CDN']
  const lb = VOCAB_BY_ID['v:term:lb']

  it('ignores case, spacing and punctuation', () => {
    expect(checkTyped('REDIS', redis)).toBe('exact')
    expect(checkTyped('load-balancer', lb)).toBe('exact')
    expect(checkTyped('Load balancers', lb)).toBe('exact')
  })

  it('forgives a small typo in names, not in acronyms', () => {
    expect(checkTyped('load balancr', lb)).toBe('close')
    expect(checkTyped('CDM', cdn)).toBe('wrong')
    expect(checkTyped('cdn', cdn)).toBe('exact')
  })

  it('rejects other answers', () => {
    expect(checkTyped('memcached', redis)).toBe('wrong')
    expect(checkTyped('', redis)).toBe('wrong')
  })
})
