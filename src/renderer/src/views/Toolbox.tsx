import { useState } from 'react'
import type { Tool } from '../../../shared/types'
import { Modal } from '../components/bits'
import { CURRICULUM } from '../content/curriculum'
import { COMPARISONS, TOOLS } from '../content/tools'
import { completedUnitIds, UNIT_INDEX } from '../lib/progress'
import { useStore } from '../store'

const unitName = (id: string): string => {
  const u = CURRICULUM[UNIT_INDEX[id]]
  return u ? `Unit ${UNIT_INDEX[id] + 1}: ${u.title}` : id
}

function ToolDetail({ tool }: { tool: Tool }): JSX.Element {
  return (
    <div className="tool-detail">
      <div className="tool-detail-head">
        <div className="tool-icon big">{tool.icon}</div>
        <div>
          <div className="eyebrow">{tool.category}</div>
          <h2>{tool.name}</h2>
          <p className="muted">{tool.tagline}</p>
        </div>
      </div>
      <div className="pros-cons">
        <div>
          <h3 className="good-text">Strengths</h3>
          <ul>{tool.strengths.map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
        <div>
          <h3 className="bad-text">Weaknesses</h3>
          <ul>{tool.weaknesses.map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
        <div>
          <h3>✅ Use when</h3>
          <ul>{tool.useWhen.map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
        <div>
          <h3>⛔ Avoid when</h3>
          <ul>{tool.avoidWhen.map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
      </div>
      <div className="muted small">
        <b>Alternatives:</b> {tool.alternatives.join(' · ')}
      </div>
    </div>
  )
}

export function Toolbox(): JSX.Element {
  const s = useStore((st) => st.s)
  const viewTool = useStore((st) => st.viewTool)
  const [tab, setTab] = useState<'tools' | 'vs'>('tools')
  const [open, setOpen] = useState<Tool | null>(null)
  const done = new Set(completedUnitIds(s))
  const unlockedCount = TOOLS.filter((t) => done.has(t.unit)).length
  const categories = [...new Set(TOOLS.map((t) => t.category))]

  return (
    <div className="toolbox">
      <h1>Toolbox</h1>
      <p className="muted">
        Real tools and the tradeoffs between them. Finish units to collect cards. {unlockedCount}/{TOOLS.length} collected.
      </p>
      <div className="tabs">
        <button className={`tab ${tab === 'tools' ? 'on' : ''}`} onClick={() => setTab('tools')}>
          🧰 Tool cards
        </button>
        <button className={`tab ${tab === 'vs' ? 'on' : ''}`} onClick={() => setTab('vs')}>
          ⚖️ Head-to-head
        </button>
      </div>

      {tab === 'tools' &&
        categories.map((cat) => (
          <section key={cat}>
            <h3 className="cat-title">{cat}</h3>
            <div className="tool-grid">
              {TOOLS.filter((t) => t.category === cat).map((t) => {
                const unlocked = done.has(t.unit)
                return (
                  <button
                    key={t.id}
                    className={`tool-card ${unlocked ? '' : 'locked'} ${unlocked && !s.toolsViewed[t.id] ? 'fresh' : ''}`}
                    disabled={!unlocked}
                    onClick={() => {
                      setOpen(t)
                      viewTool(t.id)
                    }}
                  >
                    <div className="tool-icon">{unlocked ? t.icon : '🔒'}</div>
                    <div className="tool-name">{unlocked ? t.name : '???'}</div>
                    <div className="muted small">{unlocked ? t.tagline : `Finish ${unitName(t.unit)}`}</div>
                    {unlocked && !s.toolsViewed[t.id] && <span className="pill glow">NEW · +5 XP</span>}
                  </button>
                )
              })}
            </div>
          </section>
        ))}

      {tab === 'vs' &&
        COMPARISONS.map((c) => {
          const unlocked = done.has(c.unit)
          return (
            <section key={c.id} className={`card vs ${unlocked ? '' : 'locked'}`}>
              <h2>
                {unlocked ? '⚖️' : '🔒'} {c.title}
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
                          <tr key={i}>
                            {r.map((cell, j) => (j === 0 ? <th key={j}>{cell}</th> : <td key={j}>{cell}</td>))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="callout">
                    <b>Verdict:</b> {c.verdict}
                  </div>
                </>
              ) : (
                <p className="muted small">Finish {unitName(c.unit)} to unlock this comparison.</p>
              )}
            </section>
          )
        })}

      {open && (
        <Modal onClose={() => setOpen(null)}>
          <ToolDetail tool={open} />
        </Modal>
      )}
    </div>
  )
}
