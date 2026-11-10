import { dateStr } from '../../../shared/dates'
import { Bar, Label, ProgressRing } from '../components/bits'
import { Heatmap } from '../components/Heatmap'
import { Icon } from '../components/Icon'
import { CURRICULUM } from '../content/curriculum'
import { levelInfo } from '../lib/levels'
import { ALL_LESSONS, dailyScenario, moduleCode, nextLesson, nextToolLesson } from '../lib/progress'
import { allQuestsDone, QUEST_ICON, questLabel } from '../lib/quests'
import { dueIds } from '../lib/srs'
import { useStore } from '../store'

const TYPE_ICON = { lesson: 'book-open', byte: 'mic', lab: 'flask' } as const
const TYPE_NAME = { lesson: 'Lesson', byte: 'Interview Byte', lab: 'Lab' } as const

function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Late shift'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

const dateLine = (): string =>
  new Date().toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase().replace(/,/g, '')

export function Home(): JSX.Element {
  const s = useStore((st) => st.s)
  const go = useStore((st) => st.go)
  const claimChest = useStore((st) => st.claimChest)

  const t = dateStr()
  const day = s.days[t] ?? { xp: 0, goalMet: false }
  const goal = s.settings.dailyGoal
  const left = Math.max(0, goal - day.xp)
  const next = nextLesson(s)
  const nextTool = nextToolLesson(s)
  const due = dueIds(s.srs, t).length
  const incident = dailyScenario(s, t)
  const incidentDone = s.daily?.date === t
  const lvl = levelInfo(s.xp)
  const doneCount = ALL_LESSONS.filter((l) => s.completed[l.id]).length
  const questsDone = allQuestsDone(s.quests)
  const deckSize = Object.keys(s.srs).length

  let headline: JSX.Element
  if (day.goalMet)
    headline = (
      <>
        {greeting()}. Today’s sheet is <em>signed off</em>.
      </>
    )
  else if (s.streak.count > 0)
    headline = (
      <>
        {greeting()}. <em>{left} XP</em> keeps the {s.streak.count}-day streak standing.
      </>
    )
  else
    headline = (
      <>
        {greeting()}. Start a streak with <em>one lesson</em> today.
      </>
    )

  return (
    <div className="home">
      <section className="card marked hero">
        <div>
          <Label bare>
            {dateLine()}
          </Label>
          <h1>{headline}</h1>
          <div className="hero-actions">
            {next ? (
              <button className="btn primary big" onClick={() => go('lesson', { id: next.id })}>
                Continue <Icon name="arrow-right" size={16} />
              </button>
            ) : (
              <button className="btn primary big" onClick={() => go('arena')}>
                Enter the Arena <Icon name="arrow-right" size={16} />
              </button>
            )}
            {due > 0 && (
              <button className="btn big" onClick={() => go('review')}>
                <Icon name="brain" size={16} /> Review {due} due
              </button>
            )}
          </div>
          {next && (
            <div className="next-up">
              <div className="glyph">
                <Icon name={TYPE_ICON[next.type]} size={17} />
              </div>
              <div>
                <div className="hint-text">
                  Next · Unit {String(next.unitIndex + 1).padStart(2, '0')}/{String(CURRICULUM.length).padStart(2, '0')} · {TYPE_NAME[next.type]} · {next.minutes} min
                </div>
                <div style={{ fontWeight: 500 }}>
                  {next.unit.title} — {next.title}
                </div>
              </div>
            </div>
          )}
          {nextTool && (
            <button className="next-up tools-next" onClick={() => go('lesson', { id: nextTool.id })}>
              <div className="glyph">
                <Icon name="wrench" size={17} />
              </div>
              <div>
                <div className="hint-text">
                  Tools track · {moduleCode(nextTool.unit)} · {nextTool.unit.title} · {nextTool.minutes} min
                </div>
                <div style={{ fontWeight: 500 }}>{nextTool.title}</div>
              </div>
              <Icon name="arrow-right" size={15} />
            </button>
          )}
        </div>
        <div className="hero-goal">
          <ProgressRing value={day.xp} max={goal}>
            <div className="ring-big">{day.xp}</div>
            <div className="ring-small">OF {goal} XP</div>
          </ProgressRing>
          <span className={`tag ${day.goalMet ? 'good' : ''}`}>{day.goalMet ? 'Goal met' : 'Daily goal'}</span>
        </div>
      </section>

      <section className="card quests">
        <Label n="01">Daily quests</Label>
        {s.quests?.list.map((q, i) => {
          const done = q.progress >= q.target
          return (
            <div key={i} className={`quest ${done ? 'done' : ''}`}>
              <div className="quest-icon">
                <Icon name={done ? 'check' : QUEST_ICON[q.type]} size={18} />
              </div>
              <div>
                <div className="quest-label">{questLabel(q)}</div>
                <Bar value={q.progress} max={q.target} tone={done ? 'good' : ''} />
              </div>
              <div className="quest-count">
                {q.progress}/{q.target}
              </div>
            </div>
          )
        })}
        <button
          className={`chest ${questsDone && !s.quests?.chestClaimed ? 'ready' : ''} ${s.quests?.chestClaimed ? 'claimed' : ''}`}
          disabled={!questsDone || s.quests?.chestClaimed}
          onClick={claimChest}
        >
          <Icon name={s.quests?.chestClaimed ? 'check' : questsDone ? 'gift' : 'lock'} size={16} />
          {s.quests?.chestClaimed ? 'Chest opened. New quests at midnight.' : questsDone ? 'Open chest: +40 XP and a chance of a freeze' : 'Finish all three to unlock the chest'}
        </button>
      </section>

      <section className="card incident-card">
        <Label n="02">Daily incident</Label>
        {incident ? (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              {incidentDone ? (
                <span className={`tag ${s.daily?.correct ? 'good' : 'bad'}`}>{s.daily?.correct ? 'Resolved' : 'Missed'}</span>
              ) : (
                <span className="tag gold">+25 XP · one attempt</span>
              )}
            </div>
            <div className="panel-title">{incident.title}</div>
            <p className="muted small clamp3">{incident.prompt}</p>
            <button className="btn" onClick={() => go('daily')}>
              {incidentDone ? 'Read the breakdown' : 'Respond'} <Icon name="arrow-right" size={15} />
            </button>
          </>
        ) : (
          <p className="muted">No incident today.</p>
        )}
      </section>

      <section className="card">
        <Label n="03">Spaced review</Label>
        <div className="big-num">{due}</div>
        <p className="muted small">
          {due
            ? `card${due === 1 ? '' : 's'} due. Short, frequent recall is what makes this stick.`
            : deckSize
              ? 'Nothing due. Cards resurface on a 1–32 day schedule.'
              : 'Your deck fills as you answer quiz questions.'}
        </p>
        <button className="btn" onClick={() => go('review')} disabled={!deckSize}>
          {due ? 'Start review' : 'Practice anyway'} <Icon name="arrow-right" size={15} />
        </button>
      </section>

      <section className="card activity">
        <Label n="04">Activity · 17 weeks</Label>
        <div className="stats-row">
          <div className="stat-cell">
            <div className="readout-k">Current</div>
            <div className="readout-v">{s.streak.count}d</div>
          </div>
          <div className="stat-cell">
            <div className="readout-k">Best</div>
            <div className="readout-v">{s.streak.best}d</div>
          </div>
          <div className="stat-cell">
            <div className="readout-k">Lessons</div>
            <div className="readout-v">
              {doneCount}/{ALL_LESSONS.length}
            </div>
          </div>
          <div className="stat-cell">
            <div className="readout-k">Total XP</div>
            <div className="readout-v">{s.xp}</div>
          </div>
          <div className="stat-cell">
            <div className="readout-k">Level</div>
            <div className="readout-v">{lvl.level}</div>
          </div>
        </div>
        <Heatmap days={s.days} goal={goal} />
      </section>
    </div>
  )
}
