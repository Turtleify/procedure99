import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { levelInfo, TITLES, xpForNext, xpToReach } from '../lib/levels'
import { useStore } from '../store'
import { Bar } from './bits'
import { Icon } from './Icon'

const RANK_ICON = ['sprout', 'clipboard', 'code', 'wrench', 'layers', 'network', 'landmark', 'award', 'gem', 'sparkles', 'crown']

/** Every rank title, the level and total XP it starts at, and where you are on the ladder. */
export function RanksModal({ onClose }: { onClose: () => void }): JSX.Element {
  const xp = useStore((st) => st.s.xp)
  const lvl = levelInfo(xp)
  const close = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    close.current?.focus()
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const currentRank = TITLES.reduce((idx, [min], i) => (lvl.level >= min ? i : idx), 0)
  const next = TITLES[currentRank + 1]
  const rankStart = xpToReach(TITLES[currentRank][0])
  const rankEnd = next ? xpToReach(next[0]) : null

  // portal: the top bar has its own stacking context, so render at the document root
  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal ranks" role="dialog" aria-modal="true" aria-labelledby="ranks-title" onClick={(e) => e.stopPropagation()}>
        <button ref={close} className="ranks-close" onClick={onClose} aria-label="Close">
          <Icon name="x" size={18} />
        </button>
        <div className="ranks-kicker">Your rank</div>
        <h2 id="ranks-title">
          Level {lvl.level} · {lvl.title}
        </h2>
        <div className="ranks-now">
          <div className="ranks-now-row">
            <span>To level {lvl.level + 1}</span>
            <b>
              {lvl.into} / {lvl.need} XP
            </b>
          </div>
          <Bar value={lvl.into} max={lvl.need} tone="good" />
          {next && rankEnd !== null && (
            <div className="ranks-now-row small">
              <span>
                Next rank: <b>{next[1]}</b> at level {next[0]}
              </span>
              <span>{(rankEnd - xp).toLocaleString()} XP to go</span>
            </div>
          )}
          <div className="ranks-total muted small">{xp.toLocaleString()} XP earned in total</div>
        </div>

        <ol className="ranks-list">
          {TITLES.map(([min, title], i) => {
            const start = xpToReach(min)
            const reached = i < currentRank
            const current = i === currentRank
            const until = TITLES[i + 1] ? TITLES[i + 1][0] - 1 : null
            return (
              <li key={title} className={`rank ${i === TITLES.length - 1 ? 'goat' : ''} ${reached ? 'reached' : ''} ${current ? 'current' : ''} ${!reached && !current ? 'locked' : ''}`}>
                <span className="rank-glyph">
                  <Icon name={reached ? 'check' : current ? RANK_ICON[i] : 'lock'} size={16} />
                </span>
                <div className="rank-body">
                  <div className="rank-title">
                    {title}
                    {current && <span className="tag good">You are here</span>}
                  </div>
                  <div className="muted small">
                    {until === null ? `Level ${min}+` : until === min ? `Level ${min}` : `Levels ${min}–${until}`}
                  </div>
                  {current && rankEnd !== null && <Bar value={xp - rankStart} max={rankEnd - rankStart} tone="good" />}
                </div>
                <div className="rank-xp">
                  <b>{start.toLocaleString()}</b>
                  <span>XP</span>
                </div>
              </li>
            )
          })}
        </ol>
        <p className="muted small ranks-foot">
          Level 2 takes {xpForNext(1)} XP, and each level after needs {xpForNext(2) - xpForNext(1)} XP more than the one before ({xpForNext(1)}, {xpForNext(2)}, {xpForNext(3)}, …). The XP column is
          the total you need to reach each rank.
        </p>
      </div>
    </div>,
    document.body
  )
}
