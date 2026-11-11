import { useEffect, useMemo, useRef, useState } from 'react'
import { dateStr } from '../../../shared/dates'
import { Bar, Label } from '../components/bits'
import { Icon } from '../components/Icon'
import { Mcq } from '../components/Mcq'
import { LESSON_BY_ID, QUESTIONS } from '../lib/progress'
import { shuffle } from '../lib/rng'
import { nextDueDate } from '../lib/srs'
import {
  availableVocab,
  buildSession,
  checkTyped,
  DECKS,
  deckItems,
  deckStats,
  distractors,
  dueReviewIds,
  isVocabId,
  MODES,
  pickMode,
  VOCAB_BY_ID,
  type Deck,
  type DrillMode,
  type ModeChoice,
  type TypedResult,
  type VocabItem
} from '../lib/vocab'
import { useStore } from '../store'

type DeckChoice = Deck | 'quiz'

type SessionCard = { kind: 'quiz'; id: string } | { kind: 'vocab'; item: VocabItem; mode: DrillMode }

interface Outcome {
  card: SessionCard
  right: boolean
}

interface Session {
  title: string
  cards: SessionCard[]
}

const MODE_LABEL: Record<DrillMode, string> = { name: 'Name it', define: 'Define it', type: 'Type it', flash: 'Flashcard' }
const LENGTHS = [10, 20, 50]

const vocabCard = (item: VocabItem, choice: ModeChoice, box: number | undefined): SessionCard => ({
  kind: 'vocab',
  item,
  mode: pickMode(choice, box)
})

// ───────────── Review (hub ↔ session) ─────────────

export function Review(): JSX.Element {
  const [session, setSession] = useState<Session | null>(null)
  const [run, setRun] = useState(0)
  if (session)
    return (
      <SessionPlayer
        key={run}
        session={session}
        onExit={() => setSession(null)}
        onRetry={(cards) => {
          setSession({ title: `${session.title} · missed cards`, cards })
          setRun((r) => r + 1)
        }}
      />
    )
  return (
    <ReviewHub
      onStart={(s) => {
        setSession(s)
        setRun((r) => r + 1)
      }}
    />
  )
}

// ───────────── hub ─────────────

function ReviewHub({ onStart }: { onStart(s: Session): void }): JSX.Element {
  const s = useStore((st) => st.s)
  const today = dateStr()
  const [deck, setDeck] = useState<DeckChoice>('tools')
  const [mode, setMode] = useState<ModeChoice>('mixed')
  const [length, setLength] = useState(10)
  const [everything, setEverything] = useState(false)

  const due = dueReviewIds(s.srs, today)
  const quizLearned = Object.keys(s.srs).filter((id) => QUESTIONS[id])

  const deckInfo = useMemo(
    () =>
      DECKS.map((d) => {
        const mine = availableVocab(s, d.id)
        return { ...d, mine, all: deckItems(d.id), stats: deckStats(mine, s.srs, today) }
      }),
    [s, today]
  )

  const startDue = (): void => {
    const cards = shuffle(due)
      .slice(0, 20)
      .map((id): SessionCard => (isVocabId(id) ? vocabCard(VOCAB_BY_ID[id], 'mixed', s.srs[id]?.box) : { kind: 'quiz', id }))
    onStart({ title: 'Due today', cards })
  }

  const startDeck = (): void => {
    if (deck === 'quiz') {
      const dueQ = shuffle(quizLearned.filter((id) => s.srs[id].due <= today))
      const rest = shuffle(quizLearned.filter((id) => s.srs[id].due > today))
      onStart({ title: 'Quiz questions', cards: [...dueQ, ...rest].slice(0, length).map((id) => ({ kind: 'quiz', id })) })
      return
    }
    const info = deckInfo.find((d) => d.id === deck)!
    const pool = everything ? info.all : info.mine
    const picked = buildSession(pool, s.srs, today, length)
    onStart({
      title: `${info.title} · ${MODES.find((m) => m.id === mode)!.label}`,
      cards: picked.map((v) => vocabCard(v, mode, s.srs[v.id]?.box))
    })
  }

  const sel = deck === 'quiz' ? null : deckInfo.find((d) => d.id === deck)!
  const poolSize = deck === 'quiz' ? quizLearned.length : everything ? sel!.all.length : sel!.mine.length
  const next = nextDueDate(Object.fromEntries(Object.entries(s.srs).filter(([id]) => QUESTIONS[id] || VOCAB_BY_ID[id])))

  return (
    <div className="review-hub">
      <div className="review-head">
        <div>
          <Label>Review</Label>
          <h1>
            Keep it in your <em>head</em>.
          </h1>
          <p className="muted">
            Drill the tools, terms and acronyms from your lessons. Cards you get right come back later and later (1 → 32 days); misses come back tomorrow.
          </p>
        </div>
        <div className="card review-due">
          <div className="readout-k">Due today</div>
          <div className="big-num">{due.length}</div>
          <button className="btn primary" onClick={startDue} disabled={!due.length}>
            {due.length ? `Review ${Math.min(20, due.length)} due` : 'Nothing due'} <Icon name="arrow-right" size={15} />
          </button>
          <div className="hint-text">{due.length ? 'Quiz and vocab cards together' : next ? `Next card due ${next}` : 'Start a deck below'}</div>
        </div>
      </div>

      <div className="deck-grid" role="radiogroup" aria-label="Deck">
        {deckInfo.map((d) => (
          <DeckTile
            key={d.id}
            on={deck === d.id}
            onPick={() => setDeck(d.id)}
            icon={d.icon}
            title={d.title}
            blurb={d.blurb}
            count={d.mine.length}
            total={d.all.length}
            due={d.stats.due}
            mastered={d.stats.mastered}
          />
        ))}
        <DeckTile
          on={deck === 'quiz'}
          onPick={() => setDeck('quiz')}
          icon="brain"
          title="Quiz questions"
          blurb="The questions you answered in lessons."
          count={quizLearned.length}
          due={deckStats(quizLearned, s.srs, today).due}
          mastered={deckStats(quizLearned, s.srs, today).mastered}
        />
      </div>

      <div className="card review-setup">
        {deck !== 'quiz' && (
          <div className="setup-row">
            <div className="readout-k">How to drill</div>
            <div className="mode-grid" role="radiogroup" aria-label="Drill mode">
              {MODES.map((m) => (
                <button key={m.id} role="radio" aria-checked={mode === m.id} className={`mode-opt ${mode === m.id ? 'on' : ''}`} onClick={() => setMode(m.id)}>
                  <Icon name={m.icon} size={16} />
                  <span>
                    <b>{m.label}</b>
                    <span className="mode-blurb">{m.blurb}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="setup-row setup-inline">
          <div>
            <div className="readout-k">Cards</div>
            <div className="seg" role="radiogroup" aria-label="Session length">
              {LENGTHS.map((n) => (
                <button key={n} role="radio" aria-checked={length === n} className={length === n ? 'on' : ''} onClick={() => setLength(n)}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          {sel && sel.all.length > sel.mine.length && (
            <label className="check-line">
              <input type="checkbox" checked={everything} onChange={(e) => setEverything(e.target.checked)} />
              Include all {sel.all.length}, even ones from units you haven’t reached yet
            </label>
          )}
          <button className="btn primary big" onClick={startDeck} disabled={poolSize === 0}>
            Start {Math.min(length, poolSize)} cards <Icon name="arrow-right" size={16} />
          </button>
        </div>
        {poolSize === 0 && (
          <p className="hint-text">
            {deck === 'quiz' ? 'Answer quiz questions in lessons to fill this deck.' : 'Nothing here yet. Tick “Include all”, or keep going on the Path.'}
          </p>
        )}
      </div>

      {sel && <StudyList items={everything ? sel.all : sel.mine} deck={sel.id} />}
    </div>
  )
}

function DeckTile(p: {
  on: boolean
  onPick(): void
  icon: string
  title: string
  blurb: string
  count: number
  total?: number
  due: number
  mastered: number
}): JSX.Element {
  return (
    <button role="radio" aria-checked={p.on} className={`deck-tile ${p.on ? 'on' : ''}`} onClick={p.onPick}>
      <div className="deck-top">
        <Icon name={p.icon} size={18} />
        <b>{p.title}</b>
        {p.due > 0 && <span className="badge">{p.due} due</span>}
      </div>
      <div className="muted small">{p.blurb}</div>
      <div className="deck-meta">
        <span>
          {p.count}
          {p.total !== undefined && p.total !== p.count ? ` of ${p.total}` : ''} cards
        </span>
        <span>{p.mastered} mastered</span>
      </div>
      <Bar value={p.mastered} max={p.count} tone="good" />
    </button>
  )
}

/** Read-through sheet of a deck: the fastest way to cram before drilling. */
function StudyList({ items, deck }: { items: VocabItem[]; deck: Deck }): JSX.Element {
  const srs = useStore((st) => st.s.srs)
  const [q, setQ] = useState('')
  const shown = items
    .filter((v) => !q || `${v.name} ${v.clue} ${v.tag}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name))
  return (
    <details className="card study-list">
      <summary>
        <Icon name="notebook" size={16} /> Study list · {items.length} {deck === 'tools' ? 'tools' : deck === 'terms' ? 'terms' : 'acronyms'}
      </summary>
      <input className="study-search" placeholder="Filter…" value={q} onChange={(e) => setQ(e.target.value)} />
      <dl>
        {shown.map((v) => (
          <div key={v.id} className="study-row">
            <dt>
              {v.name}
              {(srs[v.id]?.box ?? 0) >= 5 && <Icon name="check" size={13} className="good-text" />}
            </dt>
            <dd>
              {v.deck === 'tools' ? v.clue.replace(/____/g, v.name).replace(/^It /, `${v.name} `) : v.clue}
              <span className="hint-text"> · {v.tag}</span>
            </dd>
          </div>
        ))}
      </dl>
    </details>
  )
}

// ───────────── session ─────────────

function SessionPlayer({ session, onExit, onRetry }: { session: Session; onExit(): void; onRetry(cards: SessionCard[]): void }): JSX.Element {
  const answerReview = useStore((st) => st.answerReview)
  const answerVocab = useStore((st) => st.answerVocab)
  const xpNow = useStore((st) => st.s.xp)
  const startXp = useRef(useStore.getState().s.xp).current
  const [i, setI] = useState(0)
  const [log, setLog] = useState<Outcome[]>([])

  const cards = session.cards
  const record = (card: SessionCard, right: boolean): void => {
    setLog((l) => [...l, { card, right }])
    if (card.kind === 'quiz') {
      const c = useStore.getState().s.srs[card.id]
      answerReview(card.id, right, !c || c.due > dateStr())
    } else answerVocab(card.item.id, right)
  }
  const next = (): void => setI((n) => n + 1)

  if (!cards.length)
    return (
      <div className="card center-card">
        <h1>Nothing to drill</h1>
        <button className="btn primary" onClick={onExit}>
          Back to Review
        </button>
      </div>
    )

  if (i >= cards.length) {
    const right = log.filter((o) => o.right).length
    const missed = log.filter((o) => !o.right)
    const perfect = right === cards.length
    return (
      <div className="card center-card review-results">
        <div className={`results-mark ${perfect ? 'gold' : 'good'}`}>
          <Icon name={perfect ? 'target' : 'check'} size={28} />
        </div>
        <h1>{perfect ? 'Perfect recall' : 'Session done'}</h1>
        <div className="results-xp">+{xpNow - startXp} XP</div>
        <p className="muted">
          {right}/{cards.length} right. Misses come back tomorrow; the rest get pushed further out.
        </p>
        {missed.length > 0 && (
          <div className="missed-list">
            <Label bare>Study these</Label>
            {missed.map((o, k) => (
              <div key={k} className="missed-row">
                {o.card.kind === 'vocab' ? (
                  <>
                    <b>{o.card.item.name}</b>
                    <span className="muted small">{o.card.item.deck === 'tools' ? o.card.item.hint : o.card.item.clue}</span>
                  </>
                ) : (
                  <>
                    <b>{QUESTIONS[o.card.id].options[QUESTIONS[o.card.id].answer]}</b>
                    <span className="muted small">{QUESTIONS[o.card.id].q}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="results-actions">
          {missed.length > 0 && (
            <button className="btn primary" onClick={() => onRetry(shuffle(missed.map((o) => o.card)))}>
              <Icon name="repeat" size={15} /> Drill the {missed.length} missed again
            </button>
          )}
          <button className={`btn ${missed.length ? '' : 'primary'}`} onClick={onExit}>
            Back to Review
          </button>
        </div>
      </div>
    )
  }

  const card = cards[i]
  const nextLabel = i + 1 < cards.length ? 'Next card' : 'Finish'
  const right = log.filter((o) => o.right).length
  const sub =
    card.kind === 'quiz'
      ? (LESSON_BY_ID[QUESTIONS[card.id].lessonId]?.title ?? 'Quiz')
      : `${MODE_LABEL[card.mode]} · ${card.item.deck === 'tools' ? 'Tool' : card.item.deck === 'terms' ? 'Term' : 'Acronym'}`

  return (
    <div className="lesson">
      <div className="lesson-header">
        <button className="btn ghost" onClick={onExit}>
          <Icon name="x" size={15} /> Quit
        </button>
        <div className="lesson-titles">
          <Label bare>
            {session.title} · card {i + 1}/{cards.length} · {right} right
          </Label>
          <h1>{sub}</h1>
        </div>
      </div>
      <Bar value={i} max={cards.length} />
      <div className="card">
        {card.kind === 'quiz' ? (
          <QuizCard key={i} id={card.id} onAnswer={(r) => record(card, r)} onNext={next} nextLabel={nextLabel} />
        ) : card.mode === 'type' ? (
          <TypeCard key={i} item={card.item} onDone={(r) => record(card, r)} onNext={next} nextLabel={nextLabel} />
        ) : card.mode === 'flash' ? (
          <FlashCard key={i} item={card.item} onDone={(r) => record(card, r)} onNext={next} />
        ) : (
          <ChoiceCard key={i} item={card.item} mode={card.mode} onAnswer={(r) => record(card, r)} onNext={next} nextLabel={nextLabel} />
        )}
      </div>
    </div>
  )
}

function QuizCard({ id, onAnswer, onNext, nextLabel }: { id: string; onAnswer(r: boolean): void; onNext(): void; nextLabel: string }): JSX.Element {
  const q = QUESTIONS[id]
  return (
    <Mcq
      prompt={q.q}
      code={q.code}
      options={q.options.map((text, j) => ({ text, correct: j === q.answer }))}
      explain={q.explain}
      onAnswer={onAnswer}
      onNext={onNext}
      nextLabel={nextLabel}
    />
  )
}

/** What the learner reads when they have to come up with the name. */
function Clue({ item }: { item: VocabItem }): JSX.Element {
  return (
    <div className="vocab-clue">
      <div className="readout-k">{item.deck === 'tools' ? `Which tool? · ${item.tag}` : item.deck === 'terms' ? 'Which term?' : 'Which acronym stands for…'}</div>
      <p>{item.clue}</p>
      {item.hint && <p className="vocab-hint">“{item.hint}”</p>}
    </div>
  )
}

function revealText(item: VocabItem): string {
  return `${item.name}: ${item.deck === 'tools' ? (item.hint ?? '').replace(/____/g, item.name) : item.clue} · ${item.tag}`
}

function ChoiceCard({
  item,
  mode,
  onAnswer,
  onNext,
  nextLabel
}: {
  item: VocabItem
  mode: 'name' | 'define'
  onAnswer(r: boolean): void
  onNext(): void
  nextLabel: string
}): JSX.Element {
  const show = mode === 'name' ? (v: VocabItem) => v.name : (v: VocabItem) => v.clue
  const [wrong] = useState(() => distractors(item, deckItems(item.deck), show))
  return (
    <Mcq
      prompt={
        mode === 'name' ? (
          <Clue item={item} />
        ) : (
          <div className="vocab-clue">
            <div className="readout-k">{item.deck === 'acronyms' ? 'What does it stand for?' : item.deck === 'tools' ? 'What is this tool?' : 'What does this mean?'}</div>
            <div className="vocab-name">{item.name}</div>
            {item.deck === 'tools' && <div className="hint-text">{item.tag}</div>}
          </div>
        )
      }
      options={[item, ...wrong].map((v) => ({ text: show(v), correct: v.id === item.id }))}
      explain={revealText(item)}
      onAnswer={onAnswer}
      onNext={onNext}
      nextLabel={nextLabel}
    />
  )
}

function TypeCard({ item, onDone, onNext, nextLabel }: { item: VocabItem; onDone(r: boolean): void; onNext(): void; nextLabel: string }): JSX.Element {
  const [text, setText] = useState('')
  const [result, setResult] = useState<TypedResult | null>(null)
  const [override, setOverride] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  const right = result === 'exact' || result === 'close' || override
  const submit = (gaveUp = false): void => {
    if (result) return
    setResult(gaveUp ? 'wrong' : checkTyped(text, item))
  }
  const finish = (): void => {
    onDone(right)
    onNext()
  }

  return (
    <div className="type-card">
      <Clue item={item} />
      <form
        className="type-row"
        onSubmit={(e) => {
          e.preventDefault()
          if (result) finish()
          else if (text.trim()) submit()
        }}
      >
        <input
          ref={input}
          autoFocus
          className={`type-input ${result ? (right ? 'good' : 'bad') : ''}`}
          value={text}
          readOnly={!!result}
          placeholder={item.deck === 'acronyms' ? 'Type the acronym…' : 'Type the name…'}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          autoComplete="off"
        />
        {!result && (
          <>
            <button type="submit" className="btn primary" disabled={!text.trim()}>
              Check <kbd>Enter</kbd>
            </button>
            <button type="button" className="btn ghost" onClick={() => submit(true)}>
              Show me
            </button>
          </>
        )}
      </form>
      {result && (
        <div className={`mcq-feedback ${right ? 'good' : 'bad'}`}>
          <div className="mcq-verdict">
            <Icon name={right ? 'check' : 'x'} size={14} stroke={2.4} />
            {result === 'exact' ? 'Correct' : result === 'close' ? 'Close enough' : override ? 'Counted as right' : text.trim() ? 'Not quite' : 'Here it is'}
          </div>
          <p>
            <b className="vocab-answer">{item.name}</b>
            {item.deck === 'tools' && item.hint ? ` · ${item.hint.replace(/____/g, item.name)}` : ''}
            <span className="hint-text"> · {item.tag}</span>
          </p>
          <div className="row" style={{ gap: 10 }}>
            <button className="btn primary" onClick={finish} autoFocus>
              {nextLabel} <kbd>Enter</kbd>
            </button>
            {result === 'wrong' && text.trim() && !override && (
              <button className="btn ghost" onClick={() => setOverride(true)}>
                I was right
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function FlashCard({ item, onDone, onNext }: { item: VocabItem; onDone(r: boolean): void; onNext(): void }): JSX.Element {
  const [flipped, setFlipped] = useState(false)
  const grade = (r: boolean): void => {
    onDone(r)
    onNext()
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (!flipped && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault()
        setFlipped(true)
      } else if (flipped && e.key === '1') grade(false)
      else if (flipped && e.key === '2') grade(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="flash">
      <button className={`flash-face ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(true)} disabled={flipped}>
        <div className="readout-k">{item.deck === 'tools' ? 'Tool' : item.deck === 'terms' ? 'Term' : 'Acronym'}</div>
        <div className="vocab-name">{item.name}</div>
        {!flipped ? (
          <div className="hint-text">
            Say what it is out loud, then flip <kbd>Space</kbd>
          </div>
        ) : (
          <div className="flash-back">
            <p>{item.deck === 'tools' ? item.clue.replace(/____/g, item.name).replace(/^It /, `${item.name} `) : item.clue}</p>
            {item.hint && <p className="vocab-hint">“{item.hint.replace(/____/g, item.name)}”</p>}
            <div className="hint-text">{item.tag}</div>
          </div>
        )}
      </button>
      {flipped && (
        <div className="flash-grade">
          <button className="btn" onClick={() => grade(false)}>
            <Icon name="x" size={15} /> Missed it <kbd>1</kbd>
          </button>
          <button className="btn primary" onClick={() => grade(true)}>
            <Icon name="check" size={15} /> Knew it <kbd>2</kbd>
          </button>
        </div>
      )}
    </div>
  )
}
