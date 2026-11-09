import { CURRICULUM } from '../content/curriculum'
import { TOOLS } from '../content/tools'
import { isDone, isUnlocked, LESSON_BY_ID, nextLesson, unitComplete } from '../lib/progress'
import { useStore } from '../store'

const TYPE_ICON = { lesson: '📘', byte: '🎤', lab: '🧪' } as const
const TYPE_LABEL = { lesson: 'Lesson', byte: 'Interview Byte', lab: 'Hands-on Lab' } as const

export function Path(): JSX.Element {
  const s = useStore((st) => st.s)
  const go = useStore((st) => st.go)
  const current = nextLesson(s)

  return (
    <div className="path">
      <h1>Learning path</h1>
      <p className="muted">Follows the video, from "what is a server" to sharding. Finish a unit to unlock its tools in the Toolbox.</p>
      {CURRICULUM.map((unit, ui) => {
        const done = unit.lessons.filter((l) => isDone(s, l.id)).length
        const complete = unitComplete(s, unit)
        const locked = !isUnlocked(s, unit.lessons[0].id)
        const tools = TOOLS.filter((t) => t.unit === unit.id)
        return (
          <section key={unit.id} className={`unit ${locked ? 'locked' : ''} ${complete ? 'complete' : ''}`} style={{ ['--unit' as string]: unit.color }}>
            <div className="unit-head">
              <div className="unit-icon">{unit.icon}</div>
              <div className="unit-titles">
                <div className="eyebrow">Unit {ui + 1}</div>
                <h2>{unit.title}</h2>
                <div className="muted small">{unit.subtitle}</div>
              </div>
              <div className="unit-progress">
                {complete ? '✅ Complete' : `${done}/${unit.lessons.length}`}
              </div>
            </div>
            <div className="nodes">
              {unit.lessons.map((l, li) => {
                const fl = LESSON_BY_ID[l.id]
                const d = isDone(s, l.id)
                const open = isUnlocked(s, l.id)
                const isCurrent = current?.id === l.id
                const best = s.completed[l.id]?.best
                return (
                  <button
                    key={l.id}
                    className={`node ${d ? 'done' : ''} ${isCurrent ? 'current' : ''} ${!open ? 'locked' : ''}`}
                    style={{ marginLeft: `${[0, 60, 110, 60][li % 4]}px` }}
                    disabled={!open}
                    onClick={() => go('lesson', { id: l.id })}
                  >
                    <div className="node-dot">{d ? '✓' : open ? TYPE_ICON[l.type] : '🔒'}</div>
                    <div className="node-info">
                      <div className="node-title">{l.title}</div>
                      <div className="muted small">
                        {TYPE_LABEL[l.type]} · {fl.minutes} min
                        {d && fl.type === 'lesson' && best !== undefined ? ` · best ${Math.round(best * 100)}%` : ''}
                        {d ? ' · replay' : ''}
                      </div>
                    </div>
                    {isCurrent && <span className="pill glow">Up next</span>}
                  </button>
                )
              })}
            </div>
            {tools.length > 0 && (
              <div className="unit-tools muted small">
                {complete ? '🧰 Unlocked: ' : '🔒 Unlocks: '}
                {tools.map((t) => `${t.icon} ${t.name}`).join(' · ')}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
