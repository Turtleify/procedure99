import { describe, expect, it } from 'vitest'
import { AcronymScope, GLOSSARY } from '../src/renderer/src/lib/acronyms'
import { CURRICULUM } from '../src/renderer/src/content/curriculum'
import { DESIGN_PROBLEMS } from '../src/renderer/src/content/design-problems'
import { SCENARIOS } from '../src/renderer/src/content/scenarios'
import { COMPARISONS, TOOLS } from '../src/renderer/src/content/tools'
import { TOOL_TRACK } from '../src/renderer/src/content/tools-track'

const scope = (...all: string[]): AcronymScope => new AcronymScope(all)

describe('acronym expansion', () => {
  it('spells out the first use only', () => {
    const sc = scope('Track DAU. DAU grows.')
    expect(sc.text('Track DAU. DAU grows.')).toBe('Track DAU (daily active users). DAU grows.')
  })

  it('carries across strings in one scope', () => {
    const sc = scope('Put a CDN in front', 'The CDN caches')
    expect(sc.text('Put a CDN in front')).toBe('Put a CDN (content delivery network) in front')
    expect(sc.text('The CDN caches')).toBe('The CDN caches')
  })

  it('handles plurals', () => {
    expect(scope('Two VMs').text('Two VMs')).toBe('Two VMs (virtual machines)')
    expect(scope('No SPOFs').text('No SPOFs')).toBe('No SPOFs (single points of failure)')
  })

  it('respects expansions the author already wrote', () => {
    for (const s of [
      'A TTL (time-to-live) of 60s. TTL again.',
      'A <b>TTL</b> (time to live) of 60s.',
      'Daily active users (DAU) matter. DAU again.'
    ])
      expect(scope(s).text(s)).toBe(s)
  })

  it('never touches code, tags, diagrams or compound words', () => {
    const s = '<code>GET /API</code> <pre class="diagram">CDN</pre> <a title="SQL">x</a> `DB` HTTP/2 S3-compatible .NET'
    expect(scope(s).text(s)).toBe(s)
  })

  it('uses brackets inside parentheses', () => {
    const s = 'a data center (AWS, Azure)'
    expect(scope(s).text(s)).toBe('a data center (AWS [Amazon Web Services], Azure)')
  })

  it('prefers the CI/CD compound', () => {
    const s = 'Set up CI/CD.'
    expect(scope(s).text(s)).toBe('Set up CI/CD (continuous integration and continuous delivery).')
  })
})

/**
 * All-caps words in content prose that are not acronyms needing a gloss:
 * SQL keywords, Redis commands, HTTP verbs, product names, placeholders, emphasis.
 */
const IGNORED = new Set(
  (
    'ID OK US ON IN IS AS BY OR AND NOT NO ALL ANY FOR TO UP OUT END ' +
    'GET POST PUT PATCH DELETE HEAD SET SELECT WHERE FROM INSERT INTO UPDATE CREATE DROP ALTER TABLE INDEX VALUES ' +
    'JOIN GROUP ORDER LIMIT OFFSET LIKE NULL UNIQUE PRIMARY KEY REFERENCES CHECK CONSTRAINT DEFAULT BEGIN COMMIT ROLLBACK ' +
    'EXPLAIN ANALYZE VACUUM COPY CONCURRENTLY USING DESC COUNT BETWEEN WITH GENERATED ALWAYS STORED IDENTITY COLUMN ' +
    'SERIALIZABLE PARTITION MATCH ALLOW FILTERING QUORUM ONE LISTEN RUN CMD WORKDIR EXPOSE ENTRYPOINT ' +
    'EX NX PX DEL INCR INCRBY EXPIRE PEXPIRE KEYS MGET SADD SINTER SISMEMBER ZADD ZRANGE ZREVRANGE ZREVRANK ZINCRBY ' +
    'ZCARD ZREMRANGEBYSCORE WITHSCORES LPUSH LRANGE LTRIM BRPOP HSET HINCRBY XADD XREADGROUP XACK MULTI EXEC ' +
    'FLUSHALL BGSAVE REPLICAOF KEEPTTL INFO SCAN MOVED CROSSSLOT READONLY WAIT ' +
    'R2 D1 C4 V8 K8s NATS NGINX ZITADEL YARN GLACIER POSTGRES NOSQL README CODEOWNERS ' +
    'T1 T2 T3 T4 T5 T6 T7 T8 T9 T10 T11 T12 T13 A1 B7 W1 W2 XYZ QRS CONV GSI1 GSI1PK GSI1SK SQLSTATE COLLSCAN IXSCAN ' +
    'FATAL PENDING VALID INVALID VALIDATE DONE SHIPPED SHIPPING NET IO MQ AM BEFORE FULL OPEN TWO VS GEO FR'
  ).split(' ')
)

const prose = (s: string): string => s.replace(/<(pre|code|kbd)\b[^>]*>[\s\S]*?<\/\1>|<[^>]*>|`[^`]*`/g, ' ')

describe('content acronyms', () => {
  it('every acronym in prose is in the glossary (or deliberately ignored)', () => {
    const strings: string[] = []
    for (const u of [...CURRICULUM, ...TOOL_TRACK])
      for (const l of u.lessons) {
        if (l.type === 'lesson') {
          strings.push(...l.cards.map((c) => c.body))
          for (const q of l.quiz) strings.push(q.q, ...q.options, q.explain)
        } else if (l.type === 'byte') strings.push(l.prompt, ...l.hints, l.model, ...l.points)
        else strings.push(l.intro, ...l.steps.map((s) => s.body), l.outro)
      }
    for (const s of SCENARIOS) strings.push(s.prompt, ...s.options.flatMap((o) => [o.text, o.why]))
    for (const t of TOOLS) strings.push(t.summary, ...t.strengths, ...t.weaknesses, ...t.useWhen, ...t.avoidWhen)
    for (const c of COMPARISONS) strings.push(...c.rows.flat(), c.verdict)
    for (const p of DESIGN_PROBLEMS) strings.push(p.summary, p.prompt, ...p.requirements, ...(p.scale ?? []), ...p.notes)

    const unknown = new Set<string>()
    for (const s of strings)
      for (const [w] of prose(s).matchAll(/(?<![\w.\-/#])[A-Z][A-Z0-9]+(?![\w])/g)) {
        const base = w.endsWith('s') ? w.slice(0, -1) : w
        if (!(w in GLOSSARY) && !(base in GLOSSARY) && !IGNORED.has(w)) unknown.add(w)
      }
    expect([...unknown].sort()).toEqual([])
  })
})
