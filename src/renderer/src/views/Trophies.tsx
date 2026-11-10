import { Bar, Label } from '../components/bits'
import { Icon } from '../components/Icon'
import { ACHIEVEMENT_GROUPS, ACHIEVEMENTS } from '../lib/achievements'
import { useStore } from '../store'

export function Trophies(): JSX.Element {
  const s = useStore((st) => st.s)
  const earned = s.achievements
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
        <div className="trophy-total">
          <Bar value={count} max={ACHIEVEMENTS.length} tone="good" />
        </div>
      </div>
      {ACHIEVEMENT_GROUPS.map((g) => {
        const list = ACHIEVEMENTS.filter((a) => a.group === g)
        const got = list.filter((a) => earned[a.id]).length
        return (
          <section key={g} className="trophy-section">
            <Label>
              {g} · {got}/{list.length}
            </Label>
            <div className="trophy-grid">
              {list.map((a) => {
                const date = earned[a.id]
                const prog = !date && a.progress ? a.progress(s) : null
                return (
                  <div key={a.id} className={`trophy ${date ? 'earned' : ''}`}>
                    <div className="trophy-glyph">
                      <Icon name={date ? a.icon : 'lock'} size={19} />
                    </div>
                    <div className="trophy-title">{a.title}</div>
                    <div className="muted small">{a.desc}</div>
                    {date && <div className="trophy-date">EARNED {date}</div>}
                    {prog && prog[0] > 0 && (
                      <div className="trophy-progress">
                        <Bar value={prog[0]} max={prog[1]} tone="good" />
                        <span>
                          {prog[0].toLocaleString()}/{prog[1].toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
