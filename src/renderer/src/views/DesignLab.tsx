import { useCallback, useEffect, useRef, useState } from 'react'
import type { Diagram } from '../../../shared/types'
import { Bar, Label } from '../components/bits'
import { DesignCanvas } from '../components/DesignCanvas'
import { Icon } from '../components/Icon'
import { DESIGN_PROBLEMS, DIFFICULTY_XP, PROBLEM_BY_ID, type DesignProblem, type Difficulty } from '../content/design-problems'
import { grade, type CheckResult } from '../lib/design'
import { conceptUnitLabel, UNIT_INDEX } from '../lib/progress'
import { sfx } from '../lib/sound'
import { useStore } from '../store'

const DIFFS: Difficulty[] = ['Easy', 'Medium', 'Hard']
const EMPTY: Diagram = { nodes: [], edges: [] }
/** Failed runs needed before the reference design can be peeked at. */
const REF_AFTER_RUNS = 3

const unitCode = (id: string): string => `U${String((UNIT_INDEX[id] ?? 0) + 1).padStart(2, '0')}`

function DiffTag({ d }: { d: Difficulty }): JSX.Element {
  return <span className={`diff diff-${d.toLowerCase()}`}>{d}</span>
}

// ───────── problem list ─────────

function ProblemList(): JSX.Element {
  const s = useStore((st) => st.s)
  const go = useStore((st) => st.go)
  const [filter, setFilter] = useState<Difficulty | 'All'>('All')
  const rec = (id: string): NonNullable<typeof s.designs>[string] | undefined => s.designs?.[id]
  const solvedOf = (ps: DesignProblem[]): number => ps.filter((p) => rec(p.id)?.solved).length
  const shown = DESIGN_PROBLEMS.filter((p) => filter === 'All' || p.difficulty === filter)

  return (
    <div className="lab-list">
      <div className="page-head path-head">
        <div>
          <h1>
            Design <em>Lab</em>
          </h1>
          <p className="muted">
            Whiteboard practice. Drag real components onto a canvas, wire them up with arrows, then run the checks, like test cases for a system design.
          </p>
        </div>
        <div className="seg" role="radiogroup" aria-label="Difficulty">
          {(['All', ...DIFFS] as const).map((d) => (
            <button key={d} role="radio" aria-checked={filter === d} className={filter === d ? 'on' : ''} onClick={() => setFilter(d)}>
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="lab-stats">
        <div className="lab-stat">
          <div className="readout-k">Solved</div>
          <div className="readout-v">
            {solvedOf(DESIGN_PROBLEMS)}
            <span className="muted">/{DESIGN_PROBLEMS.length}</span>
          </div>
        </div>
        {DIFFS.map((d) => {
          const ps = DESIGN_PROBLEMS.filter((p) => p.difficulty === d)
          return (
            <div key={d} className="lab-stat">
              <div className="readout-k">
                <DiffTag d={d} />
              </div>
              <div className="readout-v small-v">
                {solvedOf(ps)}
                <span className="muted">/{ps.length}</span>
              </div>
              <Bar value={solvedOf(ps)} max={ps.length} tone="good" />
            </div>
          )
        })}
      </div>

      <div className="lab-table card" role="table" aria-label="Design problems">
        <div className="lab-row lab-row-head" role="row">
          <span role="columnheader">Status</span>
          <span role="columnheader">Problem</span>
          <span role="columnheader">Topics</span>
          <span role="columnheader">Difficulty</span>
          <span role="columnheader">XP</span>
        </div>
        {shown.map((p) => {
          const r = rec(p.id)
          const status = r?.solved ? 'solved' : r?.runs ? 'tried' : r?.diagram.nodes.length ? 'started' : 'new'
          return (
            <button key={p.id} className={`lab-row st-${status}`} role="row" onClick={() => go('lab', { id: p.id })}>
              <span className="lab-status" role="cell" title={{ solved: 'Solved', tried: 'Attempted', started: 'Started', new: 'Not started' }[status]}>
                {status === 'solved' ? (
                  <Icon name="check" size={16} stroke={2.4} />
                ) : status === 'new' ? (
                  <span className="lab-dot" />
                ) : (
                  <Icon name="pen-tool" size={14} />
                )}
              </span>
              <span role="cell" className="lab-title">
                <b>{p.title}</b>
                <span className="muted small">{p.summary}</span>
              </span>
              <span role="cell" className="lab-topics">
                {p.units.map((u) => (
                  <span key={u} className="tag" title={conceptUnitLabel(u)}>
                    {unitCode(u)}
                  </span>
                ))}
              </span>
              <span role="cell">
                <DiffTag d={p.difficulty} />
              </span>
              <span role="cell" className="lab-xp">
                {r?.solved ? <span className="muted">done</span> : `+${DIFFICULTY_XP[p.difficulty]}`}
              </span>
            </button>
          )
        })}
      </div>

      <div className="callout lab-howto">
        <b>How checking works.</b> There’s no single right picture. Each problem runs a set of checks on how your components connect. For example: is there a
        load balancer in front of 2+ app servers, does the app read from a cache, does slow work go through a queue? Labels are up to you. Only the shape types
        and arrows count.
      </div>
    </div>
  )
}

// ───────── editor ─────────

function Editor({ problem }: { problem: DesignProblem }): JSX.Element {
  const go = useStore((st) => st.go)
  const saveDesign = useStore((st) => st.saveDesign)
  const submitDesign = useStore((st) => st.submitDesign)
  const rec = useStore((st) => st.s.designs?.[problem.id])
  const [diagram, setDiagram] = useState<Diagram>(() => rec?.diagram ?? EMPTY)
  const [results, setResults] = useState<CheckResult[] | null>(null)
  const [stale, setStale] = useState(false)
  const [tab, setTab] = useState<'problem' | 'checks' | 'reference'>('problem')
  const [panelOpen, setPanelOpen] = useState(true)
  const [showRef, setShowRef] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const latest = useRef(diagram)

  const onChange = useCallback(
    (d: Diagram) => {
      latest.current = d
      setDiagram(d)
      setStale(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => saveDesign(problem.id, d), 400)
    },
    [problem.id, saveDesign]
  )
  // flush the pending save when leaving
  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current)
        saveDesign(problem.id, latest.current)
      }
    },
    [problem.id, saveDesign]
  )

  const runChecks = (): void => {
    if (showRef) setShowRef(false)
    const r = grade(latest.current, problem.checks)
    const passed = r.filter((c) => c.pass).length
    setResults(r)
    setStale(false)
    setTab('checks')
    setPanelOpen(true)
    if (passed === r.length) sfx.correct()
    else sfx.wrong()
    submitDesign(problem.id, passed, r.length)
  }
  const runRef = useRef(runChecks)
  runRef.current = runChecks

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        runRef.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const solved = !!rec?.solved
  const runs = rec?.runs ?? 0
  const refOpen = solved || runs >= REF_AFTER_RUNS
  const passed = results?.filter((c) => c.pass).length ?? 0
  const idx = DESIGN_PROBLEMS.findIndex((p) => p.id === problem.id)
  const nextProblem = DESIGN_PROBLEMS[idx + 1]

  return (
    <div className={`lab-editor ${panelOpen ? 'panel-open' : ''}`}>
      <header className="lab-bar">
        <button className="btn ghost small" onClick={() => go('lab')}>
          <Icon name="arrow-left" size={15} /> Problems
        </button>
        <div className="lab-bar-title">
          <b>{problem.title}</b>
          <DiffTag d={problem.difficulty} />
          {solved && (
            <span className="tag good">
              <Icon name="check" size={11} /> Solved
            </span>
          )}
        </div>
        <div className="lab-bar-actions">
          <button className="btn primary small" onClick={runChecks} title="Run checks (Ctrl+Enter)">
            <Icon name="play" size={14} /> Run checks
          </button>
          <button
            className="btn small"
            onClick={() => setPanelOpen((o) => !o)}
            title={panelOpen ? 'Hide problem panel' : 'Show problem panel'}
            aria-label="Toggle problem panel"
          >
            <Icon name={panelOpen ? 'panel-right-close' : 'panel-right-open'} size={15} />
          </button>
        </div>
      </header>

      <div className="lab-body">
        <div className="lab-canvas">
          {showRef && (
            <div className="lab-ref-banner">
              <Icon name="eye" size={14} /> Reference design (read-only)
              <button className="btn small" onClick={() => setShowRef(false)}>
                Back to my design
              </button>
            </div>
          )}
          {showRef ? <DesignCanvas key="ref" diagram={problem.reference} readOnly /> : <DesignCanvas key="mine" diagram={diagram} onChange={onChange} />}
        </div>

        {panelOpen && (
          <aside className="lab-panel">
            <div className="tabs lab-tabs" role="tablist">
              {(
                [
                  ['problem', 'Problem', 'file-text'],
                  ['checks', results ? `Checks ${passed}/${results.length}` : 'Checks', 'list-checks'],
                  ['reference', 'Reference', refOpen ? 'eye' : 'lock']
                ] as const
              ).map(([id, label, icon]) => (
                <button key={id} role="tab" aria-selected={tab === id} className={`tab ${tab === id ? 'on' : ''}`} onClick={() => setTab(id)}>
                  <Icon name={icon} size={14} /> {label}
                </button>
              ))}
            </div>

            <div className="lab-panel-body">
              {tab === 'problem' && (
                <>
                  <p>{problem.prompt}</p>
                  <Label>Requirements</Label>
                  <ul className="lab-list-ul">
                    {problem.requirements.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                  {problem.scale && (
                    <>
                      <Label>Scale</Label>
                      <ul className="lab-list-ul">
                        {problem.scale.map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  <Label>Topics</Label>
                  <div className="lab-topics wrap">
                    {problem.units.map((u) => (
                      <span key={u} className="tag">
                        {conceptUnitLabel(u)}
                      </span>
                    ))}
                  </div>
                  <div className="lab-tips">
                    <b>Tips</b>
                    <ul>
                      <li>Drag shapes in from the left, or click one to drop it in the middle.</li>
                      <li>Connect: drag from a dot on a shape’s edge, or use the arrow tool (A).</li>
                      <li>
                        Running many copies? Select a shape and set <b>Copies running</b> (×3) instead of drawing three.
                      </li>
                      <li>Double-click a shape or arrow to rename it. Double-click empty space to add a note.</li>
                      <li>
                        <kbd>Ctrl</kbd>+<kbd>Enter</kbd> runs the {problem.checks.length + 1} checks.
                      </li>
                    </ul>
                  </div>
                </>
              )}

              {tab === 'checks' &&
                (!results ? (
                  <div className="lab-empty-panel">
                    <Icon name="list-checks" size={22} />
                    <p>
                      Press <b>Run checks</b> to test your design against {problem.checks.length + 1} checks.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className={`lab-score ${passed === results.length ? 'all' : ''}`}>
                      <div>
                        <b>
                          {passed}/{results.length}
                        </b>{' '}
                        checks passed
                      </div>
                      <Bar value={passed} max={results.length} tone="good" />
                    </div>
                    {stale && <p className="muted small">You’ve changed the design since this run. Run again to re-check.</p>}
                    <ol className="lab-checks">
                      {results.map((c, i) => (
                        <li key={i} className={c.pass ? 'pass' : 'fail'}>
                          <span className="lab-check-mark">
                            <Icon name={c.pass ? 'check' : 'x'} size={13} stroke={2.6} />
                          </span>
                          <div>
                            <div className="lab-check-label">{c.label}</div>
                            {!c.pass && <div className="lab-check-hint">{c.hint}</div>}
                          </div>
                        </li>
                      ))}
                    </ol>
                    {passed === results.length && (
                      <div className="callout good">
                        <b>All checks pass.</b> Compare with the reference design to see a few more ideas.
                        <div className="lab-done-actions">
                          <button className="btn small" onClick={() => setTab('reference')}>
                            <Icon name="eye" size={14} /> Reference
                          </button>
                          {nextProblem && (
                            <button className="btn primary small" onClick={() => go('lab', { id: nextProblem.id })}>
                              Next: {nextProblem.title} <Icon name="arrow-right" size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ))}

              {tab === 'reference' &&
                (!refOpen ? (
                  <div className="lab-empty-panel">
                    <Icon name="lock" size={22} />
                    <p>
                      The reference design unlocks when you solve this problem, or after {REF_AFTER_RUNS} runs ({Math.min(runs, REF_AFTER_RUNS)}/
                      {REF_AFTER_RUNS}).
                    </p>
                  </div>
                ) : (
                  <>
                    <button className="btn small lab-ref-toggle" onClick={() => setShowRef((v) => !v)}>
                      <Icon name={showRef ? 'pen-tool' : 'eye'} size={14} /> {showRef ? 'Back to my design' : 'Show the reference design'}
                    </button>
                    <Label>Why it looks like this</Label>
                    <ul className="lab-list-ul">
                      {problem.notes.map((n) => (
                        <li key={n}>{n}</li>
                      ))}
                    </ul>
                    <p className="muted small">It’s one good answer, not the only one. Any design that passes every check counts as solved.</p>
                  </>
                ))}
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}

export function DesignLab(): JSX.Element {
  const params = useStore((st) => st.params)
  const problem = params.id ? PROBLEM_BY_ID[params.id] : undefined
  return problem ? <Editor key={problem.id} problem={problem} /> : <ProblemList />
}
