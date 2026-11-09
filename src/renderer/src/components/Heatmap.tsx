import type { DayRecord } from '../../../shared/types'
import { addDays, dateStr, parseDate } from '../../../shared/dates'

const WEEKS = 17

export function Heatmap({ days, goal }: { days: Record<string, DayRecord>; goal: number }): JSX.Element {
  const today = dateStr()
  const dow = parseDate(today).getDay() // 0 = Sunday
  const start = addDays(today, -dow - (WEEKS - 1) * 7)

  const cols: JSX.Element[] = []
  for (let w = 0; w < WEEKS; w++) {
    const cells: JSX.Element[] = []
    for (let d = 0; d < 7; d++) {
      const date = addDays(start, w * 7 + d)
      const rec = days[date]
      let lvl = 0
      if (date > today) lvl = -1
      else if (rec?.frozen && !rec.xp) lvl = 5
      else if (rec?.xp) lvl = rec.goalMet ? (rec.xp >= goal * 2 ? 4 : 3) : rec.xp >= goal / 2 ? 2 : 1
      const title = lvl === -1 ? '' : `${date}: ${rec?.xp ?? 0} XP${rec?.frozen ? ' (freeze)' : ''}${rec?.goalMet ? ' ✓' : ''}`
      cells.push(<div key={d} className={`hm-cell hm-${lvl} ${date === today ? 'hm-today' : ''}`} title={title} />)
    }
    cols.push(
      <div key={w} className="hm-col">
        {cells}
      </div>
    )
  }

  return (
    <div className="heatmap">
      <div className="hm-grid">{cols}</div>
      <div className="hm-legend">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <div key={l} className={`hm-cell hm-${l}`} />
        ))}
        <span>More</span>
        <div className="hm-cell hm-5" style={{ marginLeft: 12 }} />
        <span>Freeze</span>
      </div>
    </div>
  )
}
