import { useEffect, useRef } from 'react'
import { levelInfo, titleFor } from '../lib/levels'
import { sfx } from '../lib/sound'
import { useStore, type View } from '../store'
import { Bar } from './bits'
import { Icon } from './Icon'

/** Views where nothing is in progress, so a celebration won't interrupt. */
const CALM_VIEWS: View[] = ['home', 'path', 'toolbox', 'trophies', 'settings']

/**
 * Congratulates the user on a level-up. The level-up is recorded the moment
 * it happens, but this box waits until the user has left the lesson (or
 * review / arena / incident) and is on a calm page.
 */
export function LevelUpModal(): JSX.Element | null {
  const pending = useStore((st) => st.s.pendingLevelUp)
  const xp = useStore((st) => st.s.xp)
  const view = useStore((st) => st.view)
  const dismiss = useStore((st) => st.dismissLevelUp)
  const celebrate = useStore((st) => st.celebrate)
  const btn = useRef<HTMLButtonElement>(null)

  const open = !!pending && CALM_VIEWS.includes(view)

  useEffect(() => {
    if (!open) return
    celebrate()
    sfx.levelUp()
    btn.current?.focus()
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') dismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, celebrate, dismiss])

  if (!open || !pending) return null

  const lvl = levelInfo(xp)
  const newTitle = titleFor(pending.to) !== titleFor(pending.from)
  const jumped = pending.to - pending.from > 1

  return (
    <div className="modal-backdrop" onClick={dismiss}>
      <div className="modal levelup" role="dialog" aria-modal="true" aria-labelledby="levelup-title" onClick={(e) => e.stopPropagation()}>
        <div className="levelup-badge">
          <Icon name="chevrons-up" size={22} />
        </div>
        <div className="levelup-kicker">Level up{jumped ? ` · +${pending.to - pending.from} levels` : ''}</div>
        <div className="levelup-num" aria-hidden>
          {pending.to}
        </div>
        <h2 id="levelup-title">You reached level {pending.to}</h2>
        {newTitle ? (
          <p className="levelup-title">
            New title unlocked: <strong>{titleFor(pending.to)}</strong>
          </p>
        ) : (
          <p className="muted">Still a {titleFor(pending.to)}, and getting sharper.</p>
        )}
        <div className="levelup-next">
          <div className="levelup-next-row">
            <span>Next: level {lvl.level + 1}</span>
            <span>
              {lvl.into} / {lvl.need} XP
            </span>
          </div>
          <Bar value={lvl.into} max={lvl.need} tone="good" />
        </div>
        <button ref={btn} className="btn primary big" onClick={dismiss}>
          Keep going <Icon name="arrow-right" size={16} />
        </button>
      </div>
    </div>
  )
}
