import { ACHIEVEMENTS } from '../lib/achievements'
import { useStore } from '../store'

export function Trophies(): JSX.Element {
  const earned = useStore((st) => st.s.achievements)
  const count = ACHIEVEMENTS.filter((a) => earned[a.id]).length
  return (
    <div>
      <h1>Trophies</h1>
      <p className="muted">
        {count}/{ACHIEVEMENTS.length} unlocked
      </p>
      <div className="trophy-grid">
        {ACHIEVEMENTS.map((a) => {
          const date = earned[a.id]
          return (
            <div key={a.id} className={`trophy ${date ? 'earned' : ''}`}>
              <div className="trophy-icon">{date ? a.icon : '🔒'}</div>
              <div className="trophy-title">{a.title}</div>
              <div className="muted small">{a.desc}</div>
              {date && <div className="trophy-date">{date}</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
