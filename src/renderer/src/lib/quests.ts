import type { Quest, QuestBoard, QuestType } from '../../../shared/types'
import { hashStr, seededRng, shuffle } from './rng'

export type QuestEvent = 'xp' | 'lesson' | 'review_correct' | 'arena_correct' | 'perfect' | 'daily' | 'tool_view'

const EVENT_OF: Record<QuestType, QuestEvent> = {
  xp: 'xp',
  lesson: 'lesson',
  review: 'review_correct',
  arena: 'arena_correct',
  perfect: 'perfect',
  daily: 'daily',
  tool: 'tool_view'
}

export function questLabel(q: Quest): string {
  switch (q.type) {
    case 'xp':
      return `Earn ${q.target} XP`
    case 'lesson':
      return q.target === 1 ? 'Complete a lesson' : `Complete ${q.target} lessons`
    case 'review':
      return `Get ${q.target} review cards right`
    case 'arena':
      return `Get ${q.target} Tradeoff Arena answers right`
    case 'perfect':
      return 'Ace a quiz with 100%'
    case 'daily':
      return 'Solve the Daily Incident'
    case 'tool':
      return 'Study a tool card in the Toolbox'
  }
}

export const QUEST_ICON: Record<QuestType, string> = {
  xp: 'star',
  lesson: 'book-open',
  review: 'brain',
  arena: 'swords',
  perfect: 'target',
  daily: 'siren',
  tool: 'wrench'
}

export interface QuestContext {
  dailyGoal: number
  srsSize: number
  toolsUnlocked: number
}

/** Deterministic per date: same quests if you reopen the app on the same day. */
export function generateQuests(date: string, ctx: QuestContext): QuestBoard {
  const rng = seededRng(hashStr(`quests:${date}`))
  const pool: Omit<Quest, 'progress'>[] = [
    { type: 'lesson', target: 1 },
    { type: 'arena', target: 3 },
    { type: 'perfect', target: 1 },
    { type: 'daily', target: 1 }
  ]
  if (ctx.srsSize >= 5) pool.push({ type: 'review', target: 5 })
  if (ctx.toolsUnlocked > 0) pool.push({ type: 'tool', target: 1 })
  const picked = shuffle(pool, rng).slice(0, 2)
  return {
    date,
    chestClaimed: false,
    list: [{ type: 'xp', target: ctx.dailyGoal + 20, progress: 0 }, ...picked.map((q) => ({ ...q, progress: 0 }))]
  }
}

/** Returns a new board plus which quests just flipped to complete. */
export function applyQuestEvent(board: QuestBoard, event: QuestEvent, amount = 1): { board: QuestBoard; justCompleted: Quest[] } {
  const justCompleted: Quest[] = []
  const list = board.list.map((q) => {
    if (EVENT_OF[q.type] !== event || q.progress >= q.target) return q
    const next = { ...q, progress: Math.min(q.target, q.progress + amount) }
    if (next.progress >= next.target) justCompleted.push(next)
    return next
  })
  return { board: { ...board, list }, justCompleted }
}

export const allQuestsDone = (board: QuestBoard | null): boolean => !!board && board.list.every((q) => q.progress >= q.target)
