import { Icon } from '../components/Icon'
import { ACHIEVEMENTS } from '../lib/achievements'
import { useStore } from '../store'

export function Trophies(): JSX.Element {
  const earned = useStore((st) => st.s.achievements)
  const count = ACHIEVEMENTS.filter((a) => earned[a.id]).length
  return (
    <div>
      <div className="page-head">
        <h1>
          <em>Trophies</em>
        </h1>
        <p className="muted">
          {count} of {ACHIEVEMENTS.length} earned.
        </p>
      </div>
      <div className="trophy-grid">
        {ACHIEVEMENTS.map((a) => {
          const date = earned[a.id]
          return (
            <div key={a.id} className={`trophy ${date ? 'earned' : ''}`}>
              <div className="trophy-glyph">
                <Icon name={date ? a.icon : 'lock'} size={19} />
              </div>
              <div className="trophy-title">{a.title}</div>
              <div className="muted small">{a.desc}</div>
              {date && <div className="trophy-date">EARNED {date}</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
