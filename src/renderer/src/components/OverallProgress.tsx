import { overallProgress, pctLabel, type OverallProgress as Overall } from '../lib/overall'
import { useStore } from '../store'
import { Label } from './bits'
import { Icon } from './Icon'

const GAP_DEG = 3

function polar(c: number, r: number, deg: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180
  return [c + r * Math.cos(a), c + r * Math.sin(a)]
}

function arc(c: number, r: number, from: number, to: number): string {
  const [x1, y1] = polar(c, r, from)
  const [x2, y2] = polar(c, r, to)
  return `M${x1},${y1} A${r},${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x2},${y2}`
}

/** Donut split into one segment per area (sized by its weight), each filled by how much of it is done. */
export function ProgressWheel({ data, size = 188 }: { data: Overall; size?: number }): JSX.Element {
  const c = size / 2
  const r = c - 13
  let start = 0
  return (
    <div className="wheel" style={{ width: size, height: size }} role="img" aria-label={`${pctLabel(data.pct)} of Blueprint complete`}>
      <svg width={size} height={size}>
        {data.parts.map((p) => {
          const span = p.weight * 360
          const a = start + GAP_DEG / 2
          const b = start + span - GAP_DEG / 2
          start += span
          const frac = p.total ? p.done / p.total : 0
          return (
            <g key={p.key}>
              <path d={arc(c, r, a, b)} className="wheel-track" stroke={p.color} />
              {frac > 0 && <path d={arc(c, r, a, a + Math.max(0.6, (b - a) * frac))} className="wheel-fill" stroke={p.color} />}
            </g>
          )
        })}
      </svg>
      <div className="wheel-center">
        <div className="wheel-pct">{pctLabel(data.pct)}</div>
        <div className="wheel-sub">of Blueprint</div>
      </div>
    </div>
  )
}

/** Home: the wheel plus a clickable breakdown of every area. */
export function OverallCard(): JSX.Element {
  const s = useStore((st) => st.s)
  const go = useStore((st) => st.go)
  const data = overallProgress(s)
  return (
    <section className="card overall">
      <Label>Your whole journey</Label>
      <div className="overall-body">
        <ProgressWheel data={data} />
        <div className="overall-parts">
          {data.parts.map((p) => (
            <button key={p.key} className="overall-part" onClick={() => go(p.view, p.params)} title={`Worth ${Math.round(p.weight * 100)}% of the total`}>
              <span className="overall-swatch" style={{ background: p.color }} />
              <Icon name={p.icon} size={15} />
              <span className="overall-label">{p.label}</span>
              <span className="overall-bar">
                <span style={{ width: `${p.total ? (p.done / p.total) * 100 : 0}%`, background: p.color }} />
              </span>
              <span className="overall-count">
                {p.done}/{p.total}
              </span>
            </button>
          ))}
          <p className="muted small overall-note">Lessons count most. Each area is worth a fixed share (hover one to see it), so 100% means you’ve done everything.</p>
        </div>
      </div>
    </section>
  )
}

/** Path: a slim version of the same number. */
export function OverallStrip(): JSX.Element {
  const s = useStore((st) => st.s)
  const data = overallProgress(s)
  return (
    <div className="overall-strip" title={data.parts.map((p) => `${p.label}: ${p.done}/${p.total}`).join('\n')}>
      <span className="overall-strip-k">Blueprint complete</span>
      <div className="overall-strip-bar">
        {data.parts.map((p) => (
          <span key={p.key} style={{ width: `${p.weight * 100}%` }}>
            <span style={{ width: `${p.total ? (p.done / p.total) * 100 : 0}%`, background: p.color }} />
          </span>
        ))}
      </div>
      <b className="overall-strip-v">{pctLabel(data.pct)}</b>
    </div>
  )
}
