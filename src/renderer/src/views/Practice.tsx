import { useRef, useState } from 'react'
import type { Scenario } from '../../../shared/types'
import { dateStr } from '../../../shared/dates'
import { Label } from '../components/bits'
import { Icon } from '../components/Icon'
import { Mcq } from '../components/Mcq'
import { SCENARIOS } from '../content/scenarios'
import { availableScenarios, dailyScenario } from '../lib/progress'
import { shuffle } from '../lib/rng'
import { useStore } from '../store'

const scenarioOptions = (sc: Scenario) => sc.options.map((o) => ({ text: o.text, correct: !!o.correct, why: o.why }))

// ───────────── Tradeoff Arena ─────────────

const ROUND = 5

export function Arena(): JSX.Element {
  const s = useStore((st) => st.s)
  const answerArena = useStore((st) => st.answerArena)
  const finishRound = useStore((st) => st.finishArenaRound)
  const [round, setRound] = useState<Scenario[] | null>(null)
  const [i, setI] = useState(0)
  const [right, setRight] = useState(0)
  const [won, setWon] = useState<boolean | null>(null)
  const startXp = useRef(0)
  const xpNow = s.xp

  const pool = availableScenarios(s)
  const lockedCount = SCENARIOS.length - pool.length

  const start = (): void => {
    startXp.current = useStore.getState().s.xp
    setRound(shuffle(pool).slice(0, ROUND))
    setI(0)
    setRight(0)
    setWon(null)
  }

  if (!round) {
    return (
      <div className="arena">
        <div className="card arena-hero">
          <Label>Tradeoff Arena</Label>
          <h1>
            Every choice is a <em>tradeoff</em>.
          </h1>
          <p className="muted">
            Real-world scenarios. Pick the best tool or approach, then read why <i>every</i> option is right or wrong. That’s where the tradeoff thinking comes from.
          </p>
          <div className="stats-row">
            <div className="stat-cell">
              <div className="readout-k">Rounds won</div>
              <div className="readout-v">{s.arena.wins}</div>
            </div>
            <div className="stat-cell">
              <div className="readout-k">Played</div>
              <div className="readout-v">{s.arena.played}</div>
            </div>
            <div className="stat-cell">
              <div className="readout-k">Correct</div>
              <div className="readout-v">{s.arena.correct}</div>
            </div>
            <div className="stat-cell">
              <div className="readout-k">Scenarios open</div>
              <div className="readout-v">
                {pool.length}/{SCENARIOS.length}
              </div>
            </div>
          </div>
          <div className="row" style={{ gap: 18, flexWrap: 'wrap' }}>
            <button className="btn primary big" onClick={start}>
              Start a round of {Math.min(ROUND, pool.length)} <Icon name="arrow-right" size={16} />
            </button>
            <span className="hint-text">
              +8 XP per answer · +15 XP for 4/5{lockedCount > 0 ? ` · ${lockedCount} still locked` : ''}
            </span>
          </div>
        </div>
      </div>
    )
  }

  if (i >= round.length) {
    return (
      <div className="card center-card">
        <div className={`results-mark ${won ? 'gold' : ''}`}>
          <Icon name={won ? 'trophy' : 'swords'} size={28} />
        </div>
        <h1>{won ? 'Round won!' : 'Round over'}</h1>
        <div className="results-xp">+{xpNow - startXp.current} XP</div>
        <p className="muted">
          {right}/{round.length} correct.{won ? '' : ' Get 4 or more right to win the round.'}
        </p>
        <div className="results-actions">
          <button className="btn primary" onClick={start}>
            Play again
          </button>
          <button className="btn" onClick={() => setRound(null)}>
            Arena home
          </button>
        </div>
      </div>
    )
  }

  const sc = round[i]
  return (
    <div className="lesson">
      <div className="lesson-header">
        <button className="btn ghost" onClick={() => setRound(null)}>
          <Icon name="x" size={15} /> Quit
        </button>
        <div className="lesson-titles">
          <Label bare>
            Arena · scenario {i + 1}/{round.length} · {right} correct
          </Label>
          <h1>{sc.title}</h1>
        </div>
      </div>
      <div className="card">
        <Mcq
          key={sc.id + i}
          prompt={<p className="scenario-prompt">{sc.prompt}</p>}
          options={scenarioOptions(sc)}
          onAnswer={(c) => {
            if (c) setRight((r) => r + 1)
            answerArena(c)
          }}
          onNext={() => {
            if (i + 1 >= round.length) setWon(finishRound(right, round.length))
            setI(i + 1)
          }}
          nextLabel={i + 1 < round.length ? 'Next scenario' : 'See results'}
        />
      </div>
    </div>
  )
}

// ───────────── Daily Incident ─────────────

export function DailyIncident(): JSX.Element {
  const s = useStore((st) => st.s)
  const answerDaily = useStore((st) => st.answerDaily)
  const go = useStore((st) => st.go)
  const today = dateStr()
  const sc = dailyScenario(s, today)
  const resolved = s.daily?.date === today
  const [answeredNow, setAnsweredNow] = useState(false)

  if (!sc) return <div className="card">No incident today.</div>

  return (
    <div className="lesson">
      <div className="lesson-header">
        <button className="btn ghost" onClick={() => go('home')}>
          <Icon name="arrow-left" size={15} /> Today
        </button>
        <div className="lesson-titles">
          <Label bare>Daily incident · {today} · one attempt</Label>
          <h1>{sc.title}</h1>
        </div>
      </div>
      {resolved && !answeredNow ? (
        <div className="card">
          <p className="scenario-prompt">{sc.prompt}</p>
          <div className={`callout ${s.daily?.correct ? 'good' : 'bad'}`}>
            {s.daily?.correct ? 'You resolved this incident today.' : 'You missed this one. Study the breakdown and come back tomorrow for a new incident.'}
          </div>
          <div className="breakdown">
            {sc.options.map((o) => (
              <div key={o.text} className={`breakdown-row ${o.correct ? 'correct' : ''}`}>
                <div className="breakdown-opt">
                  <Icon name={o.correct ? 'check' : 'x'} size={15} stroke={2.2} className={o.correct ? 'good-text' : 'bad-text'} />
                  {o.text}
                </div>
                <div className="muted small">{o.why}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card">
          <Mcq
            key={sc.id}
            prompt={<p className="scenario-prompt">{sc.prompt}</p>}
            options={scenarioOptions(sc)}
            onAnswer={(c) => {
              setAnsweredNow(true)
              answerDaily(sc.id, c)
            }}
            onNext={() => go('home')}
            nextLabel="Back home"
          />
        </div>
      )}
    </div>
  )
}
