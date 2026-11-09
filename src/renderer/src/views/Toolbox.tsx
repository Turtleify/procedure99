import { useState } from 'react'
import type { Tool } from '../../../shared/types'
import { Label, Modal } from '../components/bits'
import { Icon } from '../components/Icon'
import { CURRICULUM } from '../content/curriculum'
import { COMPARISONS, TOOLS } from '../content/tools'
import { completedUnitIds, UNIT_INDEX } from '../lib/progress'
import { useStore } from '../store'

const unitName = (id: string): string => {
  const u = CURRICULUM[UNIT_INDEX[id]]
  return u ? `Unit ${String(UNIT_INDEX[id] + 1).padStart(2, '0')} · ${u.title}` : id
}

function ToolDetail({ tool }: { tool: Tool }): JSX.Element {
  return (
    <div>
      <div className="tool-detail-head">
        <div className="tool-glyph">
          <Icon name={tool.icon} size={26} />
        </div>
        <div>
          <Label bare>{tool.category}</Label>
          <h2>{tool.name}</h2>
          <p className="muted" style={{ margin: 0 }}>
            {tool.tagline}
          </p>
        </div>
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
        {tool.alternatives.map((a) => (
          <span key={a} className="tag">
            {a}
          </span>
        ))}
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
  const vsCount = COMPARISONS.filter((c) => done.has(c.unit)).length
  const categories = [...new Set(TOOLS.map((t) => t.category))]

  return (
    <div className="toolbox">
      <div className="page-head">
        <h1>
          The <em>toolbox</em>
        </h1>
        <p className="muted">Real tools and the tradeoffs between them. Each card unlocks when you finish the unit that teaches it.</p>
      </div>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'tools'} className={`tab ${tab === 'tools' ? 'on' : ''}`} onClick={() => setTab('tools')}>
          <Icon name="wrench" size={15} /> Tool cards <span className="hint-text">{unlockedCount}/{TOOLS.length}</span>
        </button>
        <button role="tab" aria-selected={tab === 'vs'} className={`tab ${tab === 'vs' ? 'on' : ''}`} onClick={() => setTab('vs')}>
          <Icon name="scale" size={15} /> Head-to-head <span className="hint-text">{vsCount}/{COMPARISONS.length}</span>
        </button>
      </div>

      {tab === 'tools' &&
        categories.map((cat, ci) => (
          <section key={cat} className="tool-section">
            <Label n={String(ci + 1).padStart(2, '0')}>{cat}</Label>
            <div className="tool-grid">
              {TOOLS.filter((t) => t.category === cat).map((t) => {
                const unlocked = done.has(t.unit)
                const fresh = unlocked && !s.toolsViewed[t.id]
                return (
                  <button
                    key={t.id}
                    className={`tool-card ${unlocked ? '' : 'locked'}`}
                    disabled={!unlocked}
                    onClick={() => {
                      setOpen(t)
                      viewTool(t.id)
                    }}
                  >
                    <div className="tool-glyph">
                      <Icon name={unlocked ? t.icon : 'lock'} size={19} />
                    </div>
                    <div className="tool-name">{unlocked ? t.name : 'CLASSIFIED'}</div>
                    <div className="muted small">{unlocked ? t.tagline : `Finish ${unitName(t.unit)}`}</div>
                    {fresh && <span className="tag gold">New · +5 XP</span>}
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
                  Finish {unitName(c.unit)} to unlock
                </p>
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
