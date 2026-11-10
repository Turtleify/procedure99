import { useEffect, useMemo, useRef, useState } from 'react'
import type { Tool } from '../../../shared/types'
import { Label, Modal } from '../components/bits'
import { Icon } from '../components/Icon'
import { CURRICULUM } from '../content/curriculum'
import { CATEGORIES, CATEGORY_BY_NAME, PHASES, type Phase } from '../content/toolbox/categories'
import { COMPARISONS, TOOLS } from '../content/tools'
import { completedUnitIds, UNIT_INDEX } from '../lib/progress'
import { useStore } from '../store'

type Tab = Phase | 'all' | 'vs'

const unitLabel = (id: string): string => {
  const u = CURRICULUM[UNIT_INDEX[id]]
  return u ? `Unit ${String(UNIT_INDEX[id] + 1).padStart(2, '0')} · ${u.title}` : id
}

const phaseOf = (t: Tool): Phase => CATEGORY_BY_NAME[t.category]?.phase ?? 'build'
const unitsOf = (t: Tool): string[] => [t.unit, ...(t.alsoIn ?? [])]

/** "Amazon SQS" ↔ "SQS", "Terraform / OpenTofu" ↔ "Terraform": loose name matching for alternatives. */
const norm = (s: string): string =>
  s
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/^(amazon|aws|google cloud|google|azure|microsoft|apache|hashicorp)\s+/, '')
    .replace(/[^a-z0-9]+/g, '')
const BY_NAME = new Map<string, Tool>()
for (const t of TOOLS) {
  BY_NAME.set(norm(t.name), t)
  for (const part of t.name.split(/\s*\/\s*/)) if (!BY_NAME.has(norm(part))) BY_NAME.set(norm(part), t)
}
const findTool = (name: string): Tool | undefined => BY_NAME.get(norm(name)) ?? BY_NAME.get(norm(name.split(/\s*\/\s*/)[0]))

function matches(t: Tool, q: string): boolean {
  if (!q) return true
  const hay = [t.name, t.tagline, t.category, t.summary, ...t.alternatives].join(' ').toLowerCase()
  return q
    .toLowerCase()
    .split(/\s+/)
    .every((w) => hay.includes(w))
}

function ToolDetail({ tool, onOpen, onUnit }: { tool: Tool; onOpen(t: Tool): void; onUnit(id: string): void }): JSX.Element {
  const phase = PHASES.find((p) => p.id === phaseOf(tool))
  return (
    <div className="tool-detail">
      <div className="tool-detail-head">
        <div className="tool-glyph">
          <Icon name={tool.icon} size={26} />
        </div>
        <div>
          <Label bare>
            {phase?.title} · {tool.category}
          </Label>
          <h2>{tool.name}</h2>
          <p className="muted" style={{ margin: 0 }}>
            {tool.tagline}
          </p>
        </div>
      </div>
      <p className="tool-summary">{tool.summary}</p>
      <div className="tool-units">
        <span className="hint-text">Comes up in</span>
        {unitsOf(tool).map((u) => (
          <button key={u} className="tag link-tag" onClick={() => onUnit(u)} title="Show every tool for this unit">
            {unitLabel(u)}
          </button>
        ))}
      </div>
      <div className="pros-cons">
        <div>
          <div className="label bare good-text">+ Strengths</div>
          <ul>{tool.strengths.map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
        <div>
          <div className="label bare bad-text">− Weaknesses</div>
          <ul>{tool.weaknesses.map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
        <div>
          <div className="label bare">Use when</div>
          <ul>{tool.useWhen.map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
        <div>
          <div className="label bare">Avoid when</div>
          <ul>{tool.avoidWhen.map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
      </div>
      <Label>Alternatives</Label>
      <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
        {tool.alternatives.map((a) => {
          const target = findTool(a)
          return target && target.id !== tool.id ? (
            <button key={a} className="tag link-tag" onClick={() => onOpen(target)} title={`Open ${target.name}`}>
              {a} <Icon name="arrow-right" size={11} />
            </button>
          ) : (
            <span key={a} className="tag">
              {a}
            </span>
          )
        })}
      </div>
    </div>
  )
}

export function Toolbox(): JSX.Element {
  const s = useStore((st) => st.s)
  const params = useStore((st) => st.params)
  const viewTool = useStore((st) => st.viewTool)
  const [tab, setTab] = useState<Tab>('all')
  const [query, setQuery] = useState('')
  const [unit, setUnit] = useState<string>(params.unit ?? '')
  const [open, setOpen] = useState<Tool | null>(null)
  const search = useRef<HTMLInputElement>(null)
  const done = new Set(completedUnitIds(s))
  const vsCount = COMPARISONS.filter((c) => done.has(c.unit)).length
  const readCount = TOOLS.filter((t) => s.toolsViewed[t.id]).length

  // "/" jumps to search, like most docs sites
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement
      if (e.key === '/' && !typing && !open) {
        e.preventDefault()
        search.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const visible = useMemo(
    () =>
      TOOLS.filter(
        (t) => (tab === 'all' || tab === 'vs' || phaseOf(t) === tab) && (!unit || unitsOf(t).includes(unit)) && matches(t, query.trim())
      ),
    [tab, unit, query]
  )
  const groups = CATEGORIES.map((c) => ({ cat: c, tools: visible.filter((t) => t.category === c.name) })).filter((g) => g.tools.length)

  const openTool = (t: Tool): void => {
    setOpen(t)
    viewTool(t.id)
    document.querySelector('.modal')?.scrollTo(0, 0) // when hopping between entries
  }
  const jump = (name: string): void => document.getElementById(`cat-${name}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const filtered = !!query.trim() || !!unit

  return (
    <div className="toolbox">
      <div className="page-head">
        <h1>
          The <em>toolbox</em>
        </h1>
        <p className="muted">
          {TOOLS.length} real tools for planning, building and running systems, with the tradeoffs between them. You&rsquo;ve read {readCount}. Each new one is worth XP.
        </p>
      </div>

      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'all'} className={`tab ${tab === 'all' ? 'on' : ''}`} onClick={() => setTab('all')}>
          <Icon name="book-open" size={15} /> All <span className="hint-text">{TOOLS.length}</span>
        </button>
        {PHASES.map((p) => (
          <button key={p.id} role="tab" aria-selected={tab === p.id} className={`tab ${tab === p.id ? 'on' : ''}`} onClick={() => setTab(p.id)}>
            <Icon name={p.icon} size={15} /> {p.title} <span className="hint-text">{TOOLS.filter((t) => phaseOf(t) === p.id).length}</span>
          </button>
        ))}
        <button role="tab" aria-selected={tab === 'vs'} className={`tab ${tab === 'vs' ? 'on' : ''}`} onClick={() => setTab('vs')}>
          <Icon name="scale" size={15} /> Head-to-head <span className="hint-text">{vsCount}/{COMPARISONS.length}</span>
        </button>
      </div>

      {tab !== 'vs' && (
        <>
          <div className="toolbox-filters">
            <label className="search-box">
              <Icon name="search" size={16} />
              <input
                ref={search}
                type="search"
                placeholder="Search tools, e.g. queue, oauth, cache, postgres"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && setQuery('')}
                aria-label="Search the toolbox"
              />
              {!query && <kbd>/</kbd>}
            </label>
            <select className="unit-select" value={unit} onChange={(e) => setUnit(e.target.value)} aria-label="Filter by unit">
              <option value="">All units</option>
              {CURRICULUM.map((u) => (
                <option key={u.id} value={u.id}>
                  {unitLabel(u.id)}
                </option>
              ))}
            </select>
          </div>

          {tab !== 'all' && <p className="muted phase-blurb">{PHASES.find((p) => p.id === tab)?.blurb}</p>}

          {groups.length > 1 && (
            <nav className="cat-jump" aria-label="Jump to category">
              {groups.map((g) => (
                <button key={g.cat.name} className="cat-chip" onClick={() => jump(g.cat.name)}>
                  <Icon name={g.cat.icon} size={13} />
                  {g.cat.name}
                  <span>{g.tools.length}</span>
                </button>
              ))}
            </nav>
          )}

          {filtered && (
            <div className="filter-note hint-text">
              {visible.length} match{visible.length === 1 ? '' : 'es'}
              {unit && ` · ${unitLabel(unit)}`}
              <button
                className="btn ghost"
                onClick={() => {
                  setQuery('')
                  setUnit('')
                }}
              >
                Clear filters
              </button>
            </div>
          )}

          {groups.length === 0 && (
            <div className="card empty-search">
              <Icon name="file-search" size={22} />
              <p>No tools match that. Try a broader word like &ldquo;database&rdquo; or &ldquo;queue&rdquo;.</p>
            </div>
          )}

          {groups.map((g, gi) => (
            <section key={g.cat.name} id={`cat-${g.cat.name}`} className="tool-section">
              <Label n={String(gi + 1).padStart(2, '0')}>{g.cat.name}</Label>
              <p className="muted small cat-blurb">{g.cat.blurb}</p>
              <div className="tool-grid">
                {g.tools.map((t) => {
                  const read = !!s.toolsViewed[t.id]
                  return (
                    <button key={t.id} className={`tool-card ${read ? 'read' : ''}`} onClick={() => openTool(t)}>
                      <div className="tool-glyph">
                        <Icon name={t.icon} size={19} />
                      </div>
                      <div className="tool-name">{t.name}</div>
                      <div className="muted small">{t.tagline}</div>
                      {read ? (
                        <span className="tool-read" aria-label="Read">
                          <Icon name="check" size={13} />
                        </span>
                      ) : (
                        <span className="tag gold">New · +5 XP</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        </>
      )}

      {tab === 'vs' &&
        COMPARISONS.map((c) => {
          const unlocked = done.has(c.unit)
          return (
            <section key={c.id} className={`card vs ${unlocked ? '' : 'locked'}`}>
              <h2>
                {!unlocked && <Icon name="lock" size={18} />}
                {c.title}
              </h2>
              {unlocked ? (
                <>
                  <div className="table-wrap">
                    <table className="vs-table">
                      <thead>
                        <tr>
                          {c.columns.map((h, i) => (
                            <th key={i}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {c.rows.map((r, i) => (
                          <tr key={i}>{r.map((cell, j) => (j === 0 ? <th key={j}>{cell}</th> : <td key={j}>{cell}</td>))}</tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="callout">
                    <b>Verdict.</b> {c.verdict}
                  </div>
                </>
              ) : (
                <p className="hint-text" style={{ margin: 0 }}>
                  Finish {unitLabel(c.unit)} to unlock
                </p>
              )}
            </section>
          )
        })}

      {open && (
        <Modal onClose={() => setOpen(null)}>
          <ToolDetail
            key={open.id}
            tool={open}
            onOpen={openTool}
            onUnit={(u) => {
              setOpen(null)
              setUnit(u)
              setQuery('')
              setTab('all')
            }}
          />
        </Modal>
      )}
    </div>
  )
}
