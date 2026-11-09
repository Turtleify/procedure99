import type { SrsCard } from '../../../shared/types'
import { addDays } from '../../../shared/dates'

/** Leitner boxes 1..6 → days until next review. */
export const BOX_DAYS = [0, 1, 2, 4, 8, 16, 32]
export const MAX_BOX = 6

/** First time a question is answered (in a lesson). */
export function introduceCard(correct: boolean, today: string): SrsCard {
  const box = correct ? 2 : 1
  return { box, due: addDays(today, BOX_DAYS[box]) }
}

/** Answer during review: correct → next box, wrong → back to box 1. */
export function answerCard(card: SrsCard | undefined, correct: boolean, today: string): SrsCard {
  const prev = card?.box ?? 1
  const box = correct ? Math.min(MAX_BOX, prev + 1) : 1
  return { box, due: addDays(today, BOX_DAYS[box]) }
}

export function dueIds(srs: Record<string, SrsCard>, today: string): string[] {
  return Object.entries(srs)
    .filter(([, c]) => c.due <= today)
    .map(([id]) => id)
}

export function nextDueDate(srs: Record<string, SrsCard>): string | null {
  let min: string | null = null
  for (const c of Object.values(srs)) if (!min || c.due < min) min = c.due
  return min
}
