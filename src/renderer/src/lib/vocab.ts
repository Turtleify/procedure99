import type { AppState, SrsCard, Tool, Unit } from '../../../shared/types'
import { CURRICULUM } from '../content/curriculum'
import { TOOLS } from '../content/tools'
import { TOOL_TRACK } from '../content/tools-track'
import { TERMS } from '../content/vocab-terms'
import { AcronymScope, GLOSSARY } from './acronyms'
import { currentUnitIndex, MODULE_FOR_TOOL, moduleUnlocked, QUESTIONS } from './progress'
import { shuffle } from './rng'

// ───────────── cards ─────────────

export type Deck = 'tools' | 'terms' | 'acronyms'

export const DECKS: { id: Deck; title: string; icon: string; blurb: string }[] = [
  { id: 'tools', title: 'Tools', icon: 'wrench', blurb: 'Which tool does this? Every Toolbox entry.' },
  { id: 'terms', title: 'Concepts & terms', icon: 'lightbulb', blurb: 'The vocabulary from your lessons, by definition.' },
  { id: 'acronyms', title: 'Acronyms', icon: 'text-search', blurb: 'What DAU, SLO and friends stand for.' }
]

export interface VocabItem {
  /** SRS id, e.g. "v:tool:redis" */
  id: string
  deck: Deck
  /** the answer, as shown */
  name: string
  /** accepted typed answers (normalized at check time) */
  answers: string[]
  /** the description you have to name; never contains the name */
  clue: string
  /** second line under the clue (tool tagline), also name-free */
  hint?: string
  /** where it belongs, shown after answering (category, unit) */
  tag: string
  /** distractors come from the same group first */
  group: string
  /** units/modules that teach it; reaching any of them adds it to the deck */
  units: string[]
}

export const isVocabId = (id: string): boolean => id.startsWith('v:')

const VENDORS = /^(Amazon|AWS|Google Cloud|Google|Azure|Microsoft|Apache|HashiCorp|Elastic|Grafana)\s+/i

const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')

/** Every way a tool's name might be written: "Amazon SQS" → Amazon SQS, SQS; "Trino / Presto" → Trino, Presto. */
export function nameVariants(name: string): string[] {
  const out = new Set<string>()
  const add = (s: string): void => {
    s = s.trim()
    if (s.length < 2) return
    out.add(s)
    const bare = s.replace(VENDORS, '')
    if (bare !== s && bare.length >= 2) out.add(bare)
  }
  const noParen = name.replace(/\s*\([^)]*\)/g, '')
  add(name)
  add(noParen)
  for (const part of noParen.split(/\s+\/\s+|\s+&\s+|\s+or\s+/)) add(part)
  // "Amazon Web Services (AWS)": the bracketed alias counts too, but not "(table format)"
  for (const [, inner] of name.matchAll(/\(([^)]*)\)/g)) if (/^[A-Z0-9][\w.\- ]{1,20}$/.test(inner)) add(inner)
  // "SAML 2.0" → "SAML"
  for (const v of [...out]) {
    const unversioned = v.replace(/\s+v?\d+(\.\d+)*$/, '')
    if (unversioned !== v) add(unversioned)
  }
  // PostgreSQL ↔ Postgres
  for (const v of [...out]) if (/^PostgreSQL$/i.test(v)) out.add('Postgres')
  // an acronym's spelled-out form gives it away too: ALB → Application Load Balancer
  for (const v of [...out]) {
    const g = GLOSSARY[v]
    if (g) out.add(Array.isArray(g) ? g[0] : g)
  }
  for (const w of GENERIC) out.delete(w)
  return [...out].sort((a, b) => b.length - a.length)
}

/** Leftovers of "Google Cloud Storage" etc. that are ordinary words; blanking them would wreck the clue. */
const GENERIC = new Set(['Storage', 'Run', 'Backup', 'Stack', 'Web Services', 'Platform', 'Cloud'])

/** Blank out a name (and an acronym gloss right after it) so the clue doesn't give the answer away. */
export function maskNames(text: string, variants: string[]): string {
  let t = text
  // an acronym gloss can sit between the words: "AWS (Amazon Web Services) IAM"
  const gloss = `(?:\\s*[([][^)\\]]*[)\\]])?`
  for (const v of variants) {
    const words = v.split(/\s+/).map(escapeRe).join(`${gloss}\\s+`)
    const re = new RegExp(`(?<![\\w])${words}(?:’s|'s)?${gloss}(?![\\w])`, 'gi')
    t = t.replace(re, '____')
  }
  // "Amazon ____" → "____"
  t = t.replace(new RegExp(`\\b(?:Amazon|AWS|Google Cloud|Google|Azure|Microsoft|Apache)${gloss}\\s+____`, 'g'), '____')
  // "____ is a…" reads better as "It is a…"
  return t.replace(/^(?:The\s+)?____(?:\s*,\s*____)*\s+(?=[a-z])/, 'It ')
}

const firstSentence = (s: string): string => {
  const m = s.match(/^.+?(?<!\b(?:e\.g|i\.e|vs|etc|incl))[.!?](?=\s+[A-Z(]|$)/)
  return (m ? m[0] : s).trim()
}

const unitTag = (id: string): string => {
  const ci = CURRICULUM.findIndex((u) => u.id === id)
  if (ci >= 0) return `Unit ${String(ci + 1).padStart(2, '0')} · ${CURRICULUM[ci].title}`
  const ti = TOOL_TRACK.findIndex((u) => u.id === id)
  return ti >= 0 ? `T${ti + 1} · ${TOOL_TRACK[ti].title}` : id
}

function toolItem(t: Tool): VocabItem {
  const variants = nameVariants(t.name)
  const units = [t.unit, ...(t.alsoIn ?? [])]
  const mod = MODULE_FOR_TOOL[t.id]
  if (mod) units.push(mod.id)
  return {
    id: `v:tool:${t.id}`,
    deck: 'tools',
    name: t.name,
    answers: variants,
    clue: maskNames(firstSentence(t.summary), variants),
    hint: maskNames(t.tagline, variants),
    tag: t.category,
    group: t.category,
    units
  }
}

/** Which units mention each acronym (so the card arrives when you meet the word). */
function acronymUnits(): Record<string, string[]> {
  const keys = Object.keys(GLOSSARY)
  const out: Record<string, string[]> = {}
  for (const u of [...CURRICULUM, ...TOOL_TRACK]) {
    const text = JSON.stringify(u.lessons)
    for (const k of keys) {
      if (new RegExp(`(?<![\\w])${escapeRe(k)}s?(?![\\w])`).test(text)) (out[k] ??= []).push(u.id)
    }
  }
  return out
}

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)

function buildItems(): VocabItem[] {
  const tools = TOOLS.map(toolItem)

  const terms: VocabItem[] = TERMS.map((t) => {
    const sc = new AcronymScope([t.def])
    return {
      id: `v:term:${t.id}`,
      deck: 'terms',
      name: t.term,
      answers: [t.term, ...(t.aka ?? [])],
      clue: sc.text(t.def),
      tag: unitTag(t.unit),
      group: t.unit,
      units: [t.unit]
    }
  })

  const where = acronymUnits()
  const acronyms: VocabItem[] = Object.entries(GLOSSARY)
    .filter(([k]) => where[k]?.length)
    .map(([k, v]) => {
      const meaning = Array.isArray(v) ? v[0] : v
      return {
        id: `v:acr:${k}`,
        deck: 'acronyms',
        name: k,
        answers: [k],
        clue: cap(meaning),
        tag: unitTag(where[k][0]),
        group: 'acronyms',
        units: where[k]
      }
    })

  return [...tools, ...terms, ...acronyms]
}

export const VOCAB: VocabItem[] = buildItems()
export const VOCAB_BY_ID: Record<string, VocabItem> = Object.fromEntries(VOCAB.map((v) => [v.id, v]))

// ───────────── what's in your deck ─────────────

/** Concept units you've reached (done + current) and Tools modules that are open. */
export function reachedUnits(s: AppState): Set<string> {
  const cur = currentUnitIndex(s)
  const ids = CURRICULUM.filter((_, i) => i <= cur).map((u) => u.id)
  for (const m of TOOL_TRACK as Unit[]) if (moduleUnlocked(s, m)) ids.push(m.id)
  return new Set(ids)
}

/** Cards you've met so far: their unit is reached, or (tools) you opened them in the Toolbox. */
export function availableVocab(s: AppState, deck?: Deck): VocabItem[] {
  const reached = reachedUnits(s)
  return VOCAB.filter(
    (v) =>
      (!deck || v.deck === deck) &&
      (v.units.some((u) => reached.has(u)) || (v.deck === 'tools' && s.toolsViewed[v.id.slice(7)]) || !!s.srs[v.id])
  )
}

export const deckItems = (deck: Deck): VocabItem[] => VOCAB.filter((v) => v.deck === deck)

/** Due review ids that still exist (quiz questions or vocab cards). */
export function dueReviewIds(srs: Record<string, SrsCard>, today: string): string[] {
  return Object.entries(srs)
    .filter(([id, c]) => c.due <= today && (QUESTIONS[id] || VOCAB_BY_ID[id]))
    .map(([id]) => id)
}

export interface DeckStats {
  total: number
  seen: number
  due: number
  /** box 5+: comes back in 16+ days */
  mastered: number
}

export function deckStats(items: VocabItem[] | string[], srs: Record<string, SrsCard>, today: string): DeckStats {
  const ids = items.map((x) => (typeof x === 'string' ? x : x.id))
  let seen = 0
  let due = 0
  let mastered = 0
  for (const id of ids) {
    const c = srs[id]
    if (!c) continue
    seen++
    if (c.due <= today) due++
    if (c.box >= 5) mastered++
  }
  return { total: ids.length, seen, due, mastered }
}

// ───────────── sessions ─────────────

export type DrillMode = 'name' | 'define' | 'type' | 'flash'
export type ModeChoice = DrillMode | 'mixed'

export const MODES: { id: ModeChoice; label: string; icon: string; blurb: string }[] = [
  { id: 'mixed', label: 'Mixed', icon: 'shuffle', blurb: 'A blend that gets harder as cards mature' },
  { id: 'name', label: 'Name it', icon: 'search', blurb: 'Read a description, pick the name' },
  { id: 'define', label: 'Define it', icon: 'book-open', blurb: 'See the name, pick what it does' },
  { id: 'type', label: 'Type it', icon: 'type', blurb: 'Read a description, type the name from memory' },
  { id: 'flash', label: 'Flashcards', icon: 'layers', blurb: 'Flip and grade yourself' }
]

/** Mixed mode: recognition while a card is new, recall once it's sticking. */
export function pickMode(choice: ModeChoice, box: number | undefined, rng: () => number = Math.random): DrillMode {
  if (choice !== 'mixed') return choice
  const r = rng()
  if (!box || box <= 2) return r < 0.5 ? 'name' : 'define'
  if (box <= 4) return r < 0.4 ? 'name' : r < 0.7 ? 'define' : 'type'
  return r < 0.6 ? 'type' : 'name'
}

/** Due cards first, then ones you've never drilled, then your weakest. */
export function buildSession(items: VocabItem[], srs: Record<string, SrsCard>, today: string, size: number): VocabItem[] {
  const due = shuffle(items.filter((v) => srs[v.id] && srs[v.id].due <= today))
  const fresh = shuffle(items.filter((v) => !srs[v.id]))
  const rest = shuffle(items.filter((v) => srs[v.id] && srs[v.id].due > today)).sort((a, b) => srs[a.id].box - srs[b.id].box)
  return [...due, ...fresh, ...rest].slice(0, size)
}

/** Three wrong answers, from the same category/unit when possible, never duplicating the right text. */
export function distractors(item: VocabItem, pool: VocabItem[], show: (v: VocabItem) => string, n = 3): VocabItem[] {
  const right = show(item).toLowerCase()
  const seen = new Set([right])
  const ok = (v: VocabItem): boolean => {
    const k = show(v).toLowerCase()
    if (v.id === item.id || seen.has(k)) return false
    seen.add(k)
    return true
  }
  const sameDeck = pool.filter((v) => v.deck === item.deck)
  const near = shuffle(sameDeck.filter((v) => v.group === item.group))
  const far = shuffle(sameDeck.filter((v) => v.group !== item.group))
  const picked: VocabItem[] = []
  for (const v of [...near, ...far]) {
    if (picked.length >= n) break
    if (ok(v)) picked.push(v)
  }
  return picked
}

// ───────────── typed answers ─────────────

export const normalize = (s: string): string =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '')

function editDistance(a: string, b: string): number {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0]
    dp[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j]
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = tmp
    }
  }
  return dp[b.length]
}

export type TypedResult = 'exact' | 'close' | 'wrong'

/** Forgiving check: case, spaces, punctuation and plurals don't matter; small typos count as "close" (still right). */
export function checkTyped(input: string, item: VocabItem): TypedResult {
  const got = normalize(input)
  if (!got) return 'wrong'
  let best = Infinity
  for (const a of item.answers) {
    for (const want of new Set([normalize(a), normalize(a).replace(/s$/, '')])) {
      if (!want) continue
      if (got === want || got === `${want}s` || `${got}s` === want) return 'exact'
      // acronyms must be spelled exactly
      if (item.deck === 'acronyms') continue
      best = Math.min(best, editDistance(got, want) / Math.max(1, want.length) <= 0.2 ? editDistance(got, want) : Infinity)
    }
  }
  return best <= 2 ? 'close' : 'wrong'
}
