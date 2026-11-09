import { dateStr } from '../../../shared/dates'
import { Bar, ProgressRing } from '../components/bits'
import { Heatmap } from '../components/Heatmap'
import { CURRICULUM } from '../content/curriculum'
import { levelInfo } from '../lib/levels'
import { dailyScenario, LESSONS, nextLesson } from '../lib/progress'
import { allQuestsDone, QUEST_ICON, questLabel } from '../lib/quests'
import { dueIds } from '../lib/srs'
import { useStore } from '../store'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Burning the midnight oil'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export function Home(): JSX.Element {
  const s = useStore((st) => st.s)
  const go = useStore((st) => st.go)
  const claimChest = useStore((st) => st.claimChest)

  const t = dateStr()
  const day = s.days[t] ?? { xp: 0, goalMet: false }
  const goal = s.settings.dailyGoal
  const next = nextLesson(s)
  const due = dueIds(s.srs, t).length
  const incident = dailyScenario(s, t)
  const incidentDone = s.daily?.date === t
  const lvl = levelInfo(s.xp)
  const doneCount = Object.keys(s.completed).length
  const questsDone = allQuestsDone(s.quests)

  let streakMsg: string
  if (day.goalMet) streakMsg = `Goal crushed. Your ${s.streak.count}-day streak is safe until tomorrow. 🔒`
  else if (s.streak.count > 0) streakMsg = `${goal - day.xp} XP to keep your 🔥 ${s.streak.count}-day streak alive.`
  else streakMsg = 'Start a streak today. One lesson takes about 5 minutes.'

  return (
    <div className="home">
      <section className="card hero">
        <div className="hero-text">
          <div className="eyebrow">{greeting()}</div>
          <h1>{next ? 'Ready to level up your system design?' : 'You finished the course. Now keep it sharp.'}</h1>
          <p className="muted">{streakMsg}</p>
          <div className="hero-actions">
            {next ? (
              <button className="btn primary big" onClick={() => go('lesson', { id: next.id })}>
                {next.type === 'lab' ? '🧪' : next.type === 'byte' ? '🎤' : '▶'} Continue: {next.title}
              </button>
            ) : (
              <button className="btn primary big" onClick={() => go('arena')}>
                ⚔️ Enter the Tradeoff Arena
              </button>
            )}
            {due > 0 && (
              <button className="btn" onClick={() => go('review')}>
                🧠 Review {due} due
              </button>
            )}
          </div>
          {next && (
            <div className="hero-sub muted">
              Unit {next.unitIndex + 1}/{CURRICULUM.length}: {next.unit.icon} {next.unit.title} · {next.minutes} min
            </div>
          )}
        </div>
        <div className="hero-goal">
          <ProgressRing value={day.xp} max={goal} size={150} stroke={12}>
            <div className="ring-big">{day.xp}</div>
            <div className="ring-small">/ {goal} XP</div>
          </ProgressRing>
          <div className="muted small">{day.goalMet ? '✅ Daily goal met' : 'Daily goal'}</div>
        </div>
      </section>

      <section className="card quests">
        <div className="card-head">
          <h2>Daily quests</h2>
          <span className="muted small">reset at midnight</span>
        </div>
        {s.quests?.list.map((q, i) => (
          <div key={i} className={`quest ${q.progress >= q.target ? 'done' : ''}`}>
            <div className="quest-icon">{q.progress >= q.target ? '✅' : QUEST_ICON[q.type]}</div>
            <div className="quest-main">
              <div className="quest-label">{questLabel(q)}</div>
              <Bar value={q.progress} max={q.target} tone={q.progress >= q.target ? 'good' : ''} />
            </div>
            <div className="quest-count">
              {q.progress}/{q.target}
            </div>
          </div>
        ))}
        <button className={`chest ${questsDone && !s.quests?.chestClaimed ? 'ready' : ''}`} disabled={!questsDone || s.quests?.chestClaimed} onClick={claimChest}>
          {s.quests?.chestClaimed ? '🎉 Chest opened. See you tomorrow!' : questsDone ? '🎁 Open chest (+40 XP, chance of ❄️)' : '🔒 Finish all quests to open the chest'}
        </button>
      </section>

      <section className={`card incident ${incidentDone ? (s.daily?.correct ? 'won' : 'lost') : ''}`}>
        <div className="card-head">
          <h2>🚨 Daily Incident</h2>
          <span className="pill">{incidentDone ? 'resolved' : '+25 XP · 1 attempt'}</span>
        </div>
        {incident ? (
          <>
            <h3>{incident.title}</h3>
            <p className="muted clamp3">{incident.prompt}</p>
            <button className="btn" onClick={() => go('daily')}>
              {incidentDone ? (s.daily?.correct ? '✅ Solved. Review the breakdown' : '📖 See what went wrong') : 'Respond to incident →'}
            </button>
          </>
        ) : (
          <p className="muted">No incident today.</p>
        )}
      </section>

      <section className="card review-card">
        <div className="card-head">
          <h2>🧠 Spaced review</h2>
        </div>
        <div className="big-num">{due}</div>
        <p className="muted">{due ? 'cards due today. Reviews lock concepts into long-term memory.' : Object.keys(s.srs).length ? 'All caught up! New cards come due as days pass.' : 'Answer quiz questions to start filling your review deck.'}</p>
        <button className="btn" onClick={() => go('review')} disabled={!Object.keys(s.srs).length}>
          {due ? 'Start review' : 'Practice anyway'}
        </button>
      </section>

      <section className="card activity">
        <div className="card-head">
          <h2>Activity</h2>
          <div className="stats-inline">
            <span>
              🔥 <b>{s.streak.count}</b> current
            </span>
            <span>
              🏅 <b>{s.streak.best}</b> best
            </span>
            <span>
              ❄️ <b>{s.streak.freezes}</b> freezes
            </span>
            <span>
              📘 <b>
                {doneCount}/{LESSONS.length}
              </b>{' '}
              lessons
            </span>
            <span>
              ⭐ <b>{s.xp}</b> XP · Lv {lvl.level}
            </span>
          </div>
        </div>
        <Heatmap days={s.days} goal={goal} />
      </section>
    </div>
  )
}
