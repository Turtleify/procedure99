import { Icon } from '../components/Icon'
import { CURRICULUM } from '../content/curriculum'
import { TOOLS } from '../content/tools'
import { isDone, isUnlocked, nextLesson, unitComplete } from '../lib/progress'
import { useStore } from '../store'

const TYPE_ICON = { lesson: 'book-open', byte: 'mic', lab: 'flask' } as const
const TYPE_LABEL = { lesson: 'Lesson', byte: 'Interview byte', lab: 'Hands-on lab' } as const

export function Path(): JSX.Element {
  const s = useStore((st) => st.s)
  const go = useStore((st) => st.go)
  const current = nextLesson(s)

  return (
    <div className="path">
      <div className="page-head">
        <h1>
          The <em>path</em>
        </h1>
        <p className="muted">From “what is a server” to sharding, in the order of the video. Finishing a unit adds its tools to your Toolbox.</p>
      </div>
      {CURRICULUM.map((unit, ui) => {
        const done = unit.lessons.filter((l) => isDone(s, l.id)).length
        const complete = unitComplete(s, unit)
        const locked = !isUnlocked(s, unit.lessons[0].id)
        const tools = TOOLS.filter((t) => t.unit === unit.id)
        return (
          <section key={unit.id} className={`unit ${locked ? 'locked' : ''} ${complete ? 'complete' : ''}`}>
            <div className="unit-num">
              UNIT
              <b>{String(ui + 1).padStart(2, '0')}</b>
            </div>
            <div className="unit-body">
              <div className="unit-head">
                <div>
                  <h2>
                    <Icon name={unit.icon} size={22} />
                    {unit.title}
                  </h2>
                  <div className="muted small">{unit.subtitle}</div>
                </div>
                <span className={`tag ${complete ? 'cyan' : ''}`}>
                  {complete ? 'Complete' : `${done} / ${unit.lessons.length}`}
                </span>
              </div>
              <div className="nodes">
                {unit.lessons.map((l) => {
                  const d = isDone(s, l.id)
                  const open = isUnlocked(s, l.id)
                  const isCurrent = current?.id === l.id
                  const best = s.completed[l.id]?.best
                  return (
                    <button
                      key={l.id}
                      className={`node t-${l.type} ${d ? 'done' : ''} ${isCurrent ? 'current' : ''} ${!open ? 'locked' : ''}`}
                      disabled={!open}
                      onClick={() => go('lesson', { id: l.id })}
                    >
                      <div className="node-mark">
                        <Icon name={d ? 'check' : open ? TYPE_ICON[l.type] : 'lock'} size={15} stroke={d ? 2.4 : 1.6} />
                      </div>
                      <div>
                        <div className="node-title">{l.title}</div>
                        <div className="node-meta">
                          {TYPE_LABEL[l.type]} · {l.minutes} min
                          {d && l.type === 'lesson' && best !== undefined ? ` · best ${Math.round(best * 100)}%` : ''}
                        </div>
                      </div>
                      {isCurrent ? <span className="tag cyan">Up next</span> : d ? <span className="hint-text">Replay</span> : <span />}
                    </button>
                  )
                })}
              </div>
              {tools.length > 0 && (
                <div className="unit-tools">
                  <span className="hint-text" style={{ marginRight: 6 }}>
                    {complete ? 'Unlocked' : 'Unlocks'}
                  </span>
                  {tools.map((t) => (
                    <span key={t.id} className={`tag ${complete ? 'cyan' : ''}`}>
                      <Icon name={complete ? t.icon : 'lock'} size={12} />
                      {t.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
