import { useEffect, useState } from 'react'
import type { Unit } from '../../../shared/types'
import { Icon } from '../components/Icon'
import { CURRICULUM } from '../content/curriculum'
import { TOOLS } from '../content/tools'
import { TOOL_TRACK } from '../content/tools-track'
import {
  conceptUnitDone,
  conceptUnitLabel,
  isDone,
  isUnlocked,
  learnedToolIds,
  LESSONS,
  moduleCode,
  moduleUnlocked,
  nextLesson,
  nextToolLesson,
  TOOL_LESSONS,
  unitComplete,
  type FlatLesson,
  type Track
} from '../lib/progress'
import { useStore } from '../store'

const TYPE_ICON = { lesson: 'book-open', byte: 'mic', lab: 'flask' } as const
const TYPE_LABEL = { lesson: 'Lesson', byte: 'Interview byte', lab: 'Hands-on lab' } as const
const TOOL_BY_ID = Object.fromEntries(TOOLS.map((t) => [t.id, t]))

function UnitSection({ unit, index, track, current }: { unit: Unit; index: number; track: Track; current: FlatLesson | null }): JSX.Element {
  const s = useStore((st) => st.s)
  const go = useStore((st) => st.go)
  const done = unit.lessons.filter((l) => isDone(s, l.id)).length
  const complete = unitComplete(s, unit)
  const isTools = track === 'tools'
  const locked = isTools ? !moduleUnlocked(s, unit) : !isUnlocked(s, unit.lessons[0].id)
  const missing = isTools ? (unit.requires ?? []).filter((id) => !conceptUnitDone(s, id)) : []
  const learned = learnedToolIds(s)
  const related = isTools
    ? (unit.teaches ?? []).map((id) => TOOL_BY_ID[id]).filter(Boolean)
    : TOOLS.filter((t) => t.unit === unit.id || t.alsoIn?.includes(unit.id))

  return (
    <section id={`unit-${unit.id}`} className={`unit ${locked ? 'locked' : ''} ${complete ? 'complete' : ''} ${isTools ? 'module' : ''}`}>
      <div className="unit-num">
        {isTools ? 'MODULE' : 'UNIT'}
        <b>{isTools ? moduleCode(unit) : String(index + 1).padStart(2, '0')}</b>
      </div>
      <div className="unit-body">
        <div className="unit-head">
          <div>
            <h2>
              <Icon name={unit.icon} size={22} />
              {unit.title}
            </h2>
            <div className="muted small">{unit.subtitle}</div>
            {isTools && (
              <div className="module-req">
                <Icon name={locked ? 'lock' : 'link'} size={12} />
                {locked ? 'Unlocks after ' : 'Builds on '}
                {(locked ? missing : (unit.requires ?? [])).map(conceptUnitLabel).join(' and ')}
              </div>
            )}
          </div>
          <span className={`tag ${complete ? 'cyan' : ''}`}>{complete ? 'Complete' : `${done} / ${unit.lessons.length}`}</span>
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
        {related.length > 0 && (
          <div className="unit-tools">
            <span className="hint-text" style={{ marginRight: 6 }}>
              {isTools ? 'Teaches' : 'In the Toolbox'}
            </span>
            {(isTools ? related : related.slice(0, 5)).map((t) => (
              <span key={t.id} className={`tag ${isTools && learned.has(t.id) ? 'learned' : ''}`} title={isTools && learned.has(t.id) ? 'Learned' : undefined}>
                <Icon name={isTools && learned.has(t.id) ? 'check' : t.icon} size={12} />
                {t.name}
              </span>
            ))}
            {!isTools && (
              <button className="tag link-tag" onClick={() => go('toolbox', { unit: unit.id })}>
                {related.length > 5 ? `+${related.length - 5} more` : 'Open'} <Icon name="arrow-right" size={11} />
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

export function Path(): JSX.Element {
  const s = useStore((st) => st.s)
  const params = useStore((st) => st.params)
  const [track, setTrack] = useState<Track>(params.track === 'tools' ? 'tools' : 'concepts')
  const units = track === 'tools' ? TOOL_TRACK : CURRICULUM
  const current = track === 'tools' ? nextToolLesson(s) : nextLesson(s)
  const conceptDone = LESSONS.filter((l) => isDone(s, l.id)).length
  const toolDone = TOOL_LESSONS.filter((l) => isDone(s, l.id)).length
  const openModules = TOOL_TRACK.filter((u) => moduleUnlocked(s, u)).length

  // deep link: scroll to a unit/module (after the app's own scroll-to-top)
  useEffect(() => {
    if (!params.unit) return
    const id = requestAnimationFrame(() => document.getElementById(`unit-${params.unit}`)?.scrollIntoView({ block: 'start' }))
    return () => cancelAnimationFrame(id)
  }, [params.unit, track])

  return (
    <div className="path">
      <div className="page-head">
        <h1>
          The <em>path</em>
        </h1>
        <p className="muted">
          {track === 'concepts'
            ? 'From “what is a server” to sharding, in the order of the video. Each unit links to the real tools it covers in the Toolbox.'
            : 'Hands-on with the real tools: configs, commands, gotchas, and how to talk about them in an interview. Each module opens when you finish the concept unit it builds on.'}
        </p>
      </div>

      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={track === 'concepts'} className={`tab ${track === 'concepts' ? 'on' : ''}`} onClick={() => setTrack('concepts')}>
          <Icon name="lightbulb" size={15} /> Concepts{' '}
          <span className="hint-text">
            {conceptDone}/{LESSONS.length}
          </span>
        </button>
        <button role="tab" aria-selected={track === 'tools'} className={`tab ${track === 'tools' ? 'on' : ''}`} onClick={() => setTrack('tools')}>
          <Icon name="wrench" size={15} /> Tools{' '}
          <span className="hint-text">
            {toolDone}/{TOOL_LESSONS.length}
          </span>
        </button>
      </div>

      {track === 'tools' && openModules === 0 && (
        <div className="callout">
          <b>The Tools track opens as you learn the concepts.</b> Finish Unit 01 · Foundations to unlock the first module, Cloud fundamentals.
        </div>
      )}

      {units.map((unit, ui) => (
        <UnitSection key={unit.id} unit={unit} index={ui} track={track} current={current} />
      ))}
    </div>
  )
}
