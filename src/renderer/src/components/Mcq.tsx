import { useEffect, useState, type ReactNode } from 'react'
import { shuffle } from '../lib/rng'

export interface McqOption {
  text: string
  correct: boolean
  why?: string
}

interface Props {
  prompt: ReactNode
  options: McqOption[]
  explain?: string
  onAnswer(correct: boolean): void
  onNext(): void
  nextLabel?: string
}

/** Multiple choice with shuffled options, 1–4 hotkeys and Enter to continue. Key it per question. */
export function Mcq({ prompt, options, explain, onAnswer, onNext, nextLabel = 'Next' }: Props): JSX.Element {
  // shuffle once per mount (parents key this component per question)
  const [order] = useState(() => shuffle(options.map((_, i) => i)))
  const [picked, setPicked] = useState<number | null>(null)

  const pick = (i: number): void => {
    if (picked !== null) return
    setPicked(i)
    onAnswer(options[i].correct)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return
      const n = Number(e.key)
      if (n >= 1 && n <= order.length) pick(order[n - 1])
      // a focused button already turns Enter into a click; don't advance twice
      else if (e.key === 'Enter' && picked !== null && !(e.target instanceof HTMLButtonElement)) onNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const answered = picked !== null
  const gotIt = answered && options[picked].correct
  const showWhys = options.some((o) => o.why)

  return (
    <div className="mcq">
      <div className="mcq-prompt">{prompt}</div>
      <div className="mcq-options">
        {order.map((i, pos) => {
          const o = options[i]
          let cls = 'mcq-option'
          if (answered) {
            if (o.correct) cls += ' correct'
            else if (i === picked) cls += ' wrong'
            else cls += ' dim'
          }
          return (
            <button key={i} className={cls} onClick={() => pick(i)} disabled={answered}>
              <span className="mcq-key">{pos + 1}</span>
              <span className="mcq-text">
                {o.text}
                {answered && showWhys && o.why && <span className="mcq-why">{o.why}</span>}
              </span>
            </button>
          )
        })}
      </div>
      {answered && (
        <div className={`mcq-feedback ${gotIt ? 'good' : 'bad'}`}>
          <div className="mcq-verdict">{gotIt ? '✅ Correct!' : '❌ Not quite'}</div>
          {explain && <p>{explain}</p>}
          <button className="btn primary" onClick={onNext} autoFocus>
            {nextLabel} <kbd>Enter</kbd>
          </button>
        </div>
      )}
    </div>
  )
}
