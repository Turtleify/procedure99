import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { ByteLesson, ConceptLesson, LabLesson } from '../../../shared/types'
import { CodeBlock, Html, Label } from '../components/bits'
import { Icon } from '../components/Icon'
import { Mcq } from '../components/Mcq'
import { LESSON_BY_ID, LESSONS, qid, type FlatLesson } from '../lib/progress'
import { useStore, type CompleteResult } from '../store'

type Flat<T> = T & Omit<FlatLesson, keyof T>

export function LessonPlayer(): JSX.Element {
  const id = useStore((st) => st.params.id)
  const go = useStore((st) => st.go)
  const lesson = id ? LESSON_BY_ID[id] : undefined
  if (!lesson) {
    return (
      <div className="card">
        <p>Lesson not found.</p>
        <button className="btn" onClick={() => go('path')}>
          Back to path
        </button>
      </div>
    )
  }
  if (lesson.type === 'lesson') return <ConceptPlayer lesson={lesson as Flat<ConceptLesson>} />
  if (lesson.type === 'byte') return <BytePlayer lesson={lesson as Flat<ByteLesson>} />
  return <LabPlayer lesson={lesson as Flat<LabLesson>} />
}

function LessonHeader({ lesson, step, total, label }: { lesson: FlatLesson; step: number; total: number; label: string }): JSX.Element {
  const go = useStore((st) => st.go)
  return (
    <div className="lesson-header">
      <button className="btn ghost" onClick={() => go('path')}>
        <Icon name="arrow-left" size={15} /> Path
      </button>
      <div className="lesson-titles">
        <Label bare>
          Unit {String(lesson.unitIndex + 1).padStart(2, '0')} · {lesson.unit.title} · {label}
        </Label>
        <h1>{lesson.title}</h1>
      </div>
      <div className="steps">
        {Array.from({ length: total }, (_, i) => (
          <div key={i} className={`step ${i < step ? 'done' : ''} ${i === step ? 'on' : ''}`} />
        ))}
      </div>
    </div>
  )
}

function Results({ lesson, startXp, mark, tone, title, result, children }: { lesson: FlatLesson; startXp: number; mark: string; tone?: 'gold' | 'good'; title: string; result: CompleteResult | null; children?: ReactNode }): JSX.Element {
  const xpNow = useStore((st) => st.s.xp)
  const go = useStore((st) => st.go)
  const next = LESSONS[lesson.index + 1]
  return (
    <div className="card results">
      <div className={`results-mark ${tone ?? ''}`}>
        <Icon name={mark} size={28} />
      </div>
      <h1>{title}</h1>
      <div className="results-xp">+{xpNow - startXp} XP</div>
      {children}
      {result?.unitJustDone && (
        <div className="callout gold">
          <b>Unit complete: {lesson.unit.title}.</b>
          {result.newTools.length > 0 && <> New tools in your Toolbox: {result.newTools.join(', ')}.</>}
        </div>
      )}
      {!result?.first && <p className="muted small">Replay: reduced XP, but it still counts toward your daily goal and quests.</p>}
      <div className="results-actions">
        {next && (
          <button className="btn primary big" onClick={() => go('lesson', { id: next.id })} autoFocus>
            Next: {next.title} <Icon name="arrow-right" size={16} />
          </button>
        )}
        {result?.newTools.length ? (
          <button className="btn" onClick={() => go('toolbox')}>
            <Icon name="wrench" size={15} /> Open Toolbox
          </button>
        ) : null}
        <button className="btn" onClick={() => go('home')}>
          Home
        </button>
      </div>
    </div>
  )
}

// ───────────── Concept lesson: cards → quiz → results ─────────────

function ConceptPlayer({ lesson }: { lesson: Flat<ConceptLesson> }): JSX.Element {
  const answer = useStore((st) => st.answerLessonQuestion)
  const complete = useStore((st) => st.completeLesson)
  const startXp = useRef(useStore.getState().s.xp).current
  const [phase, setPhase] = useState<'cards' | 'quiz' | 'done'>('cards')
  const [card, setCard] = useState(0)
  const [qi, setQi] = useState(0)
  const [score, setScore] = useState(0)
  const [result, setResult] = useState<CompleteResult | null>(null)

  const nCards = lesson.cards.length
  const nQ = lesson.quiz.length

  useEffect(() => {
    if (phase !== 'cards') return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'ArrowRight') {
        if (card < nCards - 1) setCard(card + 1)
        else setPhase('quiz')
      } else if (e.key === 'ArrowLeft' && card > 0) setCard(card - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, card, nCards])

  if (phase === 'done') {
    const perfect = score === nQ
    return (
      <Results lesson={lesson} startXp={startXp} mark={perfect ? 'target' : 'check'} tone={perfect ? 'gold' : 'good'} title={perfect ? 'Flawless.' : 'Lesson complete'} result={result}>
        <p className="muted">
          You got <b>{score}</b> of <b>{nQ}</b> right. Every question is now in your review deck and will come back when it’s due.
        </p>
      </Results>
    )
  }

  if (phase === 'cards') {
    const c = lesson.cards[card]
    return (
      <div className="lesson">
        <LessonHeader lesson={lesson} step={card} total={nCards + 1} label={`Card ${card + 1}/${nCards}`} />
        <div className="card concept" key={card}>
          <h2>{c.title}</h2>
          <Html html={c.body} className="concept-body" />
        </div>
        <div className="lesson-nav">
          <button className="btn" disabled={card === 0} onClick={() => setCard(card - 1)}>
            <Icon name="arrow-left" size={15} /> Back
          </button>
          <span className="hint-text">← → to navigate</span>
          {card < nCards - 1 ? (
            <button className="btn primary" onClick={() => setCard(card + 1)}>
              Next <Icon name="arrow-right" size={15} />
            </button>
          ) : (
            <button className="btn primary" onClick={() => setPhase('quiz')}>
              Start quiz · {nQ} questions <Icon name="arrow-right" size={15} />
            </button>
          )}
        </div>
      </div>
    )
  }

  const q = lesson.quiz[qi]
  return (
    <div className="lesson">
      <LessonHeader lesson={lesson} step={nCards} total={nCards + 1} label={`Question ${qi + 1}/${nQ}`} />
      <div className="card">
        <Mcq
          key={qi}
          prompt={q.q}
          options={q.options.map((text, i) => ({ text, correct: i === q.answer }))}
          explain={q.explain}
          onAnswer={(correct) => {
            if (correct) setScore((x) => x + 1)
            answer(qid(lesson.id, qi), correct)
          }}
          onNext={() => {
            if (qi + 1 < nQ) setQi(qi + 1)
            else {
              setResult(complete(lesson.id, { score, total: nQ }))
              setPhase('done')
            }
          }}
          nextLabel={qi + 1 < nQ ? 'Next question' : 'Finish'}
        />
      </div>
    </div>
  )
}

// ───────────── Interview byte: write → compare → self-grade ─────────────

function BytePlayer({ lesson }: { lesson: Flat<ByteLesson> }): JSX.Element {
  const saved = useStore((st) => st.s.notes[lesson.id] ?? '')
  const first = useStore((st) => !st.s.completed[lesson.id])
  const saveNote = useStore((st) => st.saveNote)
  const complete = useStore((st) => st.completeLesson)
  const startXp = useRef(useStore.getState().s.xp).current
  const [phase, setPhase] = useState<'write' | 'reveal' | 'done'>('write')
  const [text, setText] = useState(saved)
  const [showHints, setShowHints] = useState(false)
  const [checks, setChecks] = useState<boolean[]>(() => lesson.points.map(() => false))
  const [result, setResult] = useState<CompleteResult | null>(null)
  const covered = checks.filter(Boolean).length

  if (phase === 'done') {
    return (
      <Results lesson={lesson} startXp={startXp} mark="mic" tone="good" title="Byte complete" result={result}>
        <p className="muted">
          You covered <b>{covered}</b> of <b>{lesson.points.length}</b> key points. Your answer is saved, so come back later and see how it would change.
        </p>
      </Results>
    )
  }

  return (
    <div className="lesson">
      <LessonHeader lesson={lesson} step={phase === 'write' ? 0 : 1} total={2} label="Interview Byte" />
      <div className="card">
        <Label n="Q">The interviewer asks</Label>
        <p className="byte-prompt">{lesson.prompt}</p>
        <button className="btn ghost small" onClick={() => setShowHints(!showHints)}>
          <Icon name="lightbulb" size={14} /> {showHints ? 'Hide hints' : 'Show hints'}
        </button>
        {showHints && (
          <ul className="hints">
            {lesson.hints.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        )}
      </div>

      {phase === 'write' ? (
        <div className="card">
          <label htmlFor="byte-answer">
            <Label n="A">Your answer — talk it through as you would out loud</Label>
          </label>
          <textarea id="byte-answer" className="byte-text" value={text} onChange={(e) => setText(e.target.value)} placeholder="First, I'd clarify… then…" autoFocus />
          <div className="lesson-nav">
            <span className="muted small">{text.trim().split(/\s+/).filter(Boolean).length} words</span>
            <button
              className="btn primary"
              disabled={text.trim().length < 20}
              onClick={() => {
                saveNote(lesson.id, text)
                setPhase('reveal')
              }}
            >
              Reveal model answer <Icon name="arrow-right" size={15} />
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="compare">
            <div className="card">
              <Label>Your answer</Label>
              <div className="user-answer">{text}</div>
            </div>
            <div className="card model">
              <Label n="B">Model answer</Label>
              <Html html={lesson.model} className="concept-body" />
            </div>
          </div>
          <div className="card">
            <Label n="C">Which key points did you cover? Be honest.</Label>
            <div className="checklist">
              {lesson.points.map((p, i) => (
                <label key={p} className={`check ${checks[i] ? 'on' : ''}`}>
                  <input type="checkbox" checked={checks[i]} onChange={() => setChecks(checks.map((c, j) => (j === i ? !c : c)))} />
                  {p}
                </label>
              ))}
            </div>
            <div className="lesson-nav">
              <span className="muted small">
                {covered}/{lesson.points.length} covered
              </span>
              <button
                className="btn primary"
                onClick={() => {
                  setResult(complete(lesson.id, { points: covered }))
                  setPhase('done')
                }}
              >
                Claim +{first ? 10 + 5 * covered : 5} XP
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ───────────── Lab: checklist of hands-on steps ─────────────

function LabPlayer({ lesson }: { lesson: Flat<LabLesson> }): JSX.Element {
  const complete = useStore((st) => st.completeLesson)
  const first = useStore((st) => !st.s.completed[lesson.id])
  const startXp = useRef(useStore.getState().s.xp).current
  const [checked, setChecked] = useState<boolean[]>(() => lesson.steps.map(() => false))
  const [result, setResult] = useState<CompleteResult | null>(null)
  const doneCount = checked.filter(Boolean).length

  if (result) {
    return (
      <Results lesson={lesson} startXp={startXp} mark="flask" tone="good" title="Lab complete" result={result}>
        <p className="muted">{lesson.outro}</p>
      </Results>
    )
  }

  return (
    <div className="lesson">
      <LessonHeader lesson={lesson} step={doneCount} total={lesson.steps.length} label="Hands-on Lab" />
      <div className="card">
        <p>{lesson.intro}</p>
        <p className="muted small">Tick each step as you finish it in your terminal. +{first ? 60 : 10} XP when done.</p>
      </div>
      {lesson.steps.map((step, i) => (
        <div key={i} className={`card lab-step ${checked[i] ? 'done' : ''}`}>
          <label className="lab-step-head">
            <input type="checkbox" checked={checked[i]} onChange={() => setChecked(checked.map((c, j) => (j === i ? !c : c)))} />
            <span className="lab-num">STEP {String(i + 1).padStart(2, '0')}</span>
            <h3>{step.title}</h3>
          </label>
          <p className="muted">{step.body}</p>
          {step.code && <CodeBlock code={step.code} />}
        </div>
      ))}
      <div className="lesson-nav">
        <span className="muted small">
          {doneCount}/{lesson.steps.length} steps
        </span>
        <button className="btn primary big" disabled={doneCount < lesson.steps.length} onClick={() => setResult(complete(lesson.id, {}))}>
          Complete lab (+{first ? 60 : 10} XP)
        </button>
      </div>
    </div>
  )
}
