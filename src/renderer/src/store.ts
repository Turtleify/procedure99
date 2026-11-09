import { create } from 'zustand'
import type { AppState, BridgeApi, Settings } from '../../shared/types'
import { dateStr } from '../../shared/dates'
import { defaultState, hydrate } from '../../shared/defaults'
import { TOOLS } from './content/tools'
import { ACHIEVEMENTS } from './lib/achievements'
import { levelInfo } from './lib/levels'
import { LESSON_BY_ID, unitComplete, unlockedTools } from './lib/progress'
import { allQuestsDone, applyQuestEvent, generateQuests, QUEST_ICON, questLabel, type QuestEvent } from './lib/quests'
import { answerCard, introduceCard } from './lib/srs'
import { markFrozen, MAX_FREEZES, reconcileStreak, registerGoal } from './lib/streak'

export type View = 'home' | 'path' | 'lesson' | 'review' | 'arena' | 'daily' | 'toolbox' | 'trophies' | 'settings'
const VIEWS: View[] = ['home', 'path', 'lesson', 'review', 'arena', 'daily', 'toolbox', 'trophies', 'settings']

export type Tone = 'good' | 'gold' | 'fire' | 'ice' | 'bad'
export interface Toast {
  id: number
  icon: string
  title: string
  body?: string
  tone?: Tone
}

interface Fx {
  xp: number
  toasts: Omit<Toast, 'id'>[]
  confetti: boolean
}

export interface CompleteResult {
  first: boolean
  xp: number
  perfect: boolean
  unitJustDone: boolean
  newTools: string[]
}

// ---------- bridge (falls back to localStorage when run in a plain browser) ----------

const fallbackApi: BridgeApi = {
  load: async () => {
    try {
      const raw = localStorage.getItem('blueprint')
      return raw ? (JSON.parse(raw) as AppState) : null
    } catch {
      return null
    }
  },
  save: async (s) => {
    try {
      localStorage.setItem('blueprint', JSON.stringify(s))
    } catch {
      /* ignore */
    }
  },
  setStartupMode: async () => undefined,
  testNotification: async () => undefined,
  getInfo: async () => ({ version: 'browser', isPackaged: false, openAtLogin: false }),
  onNavigate: () => () => undefined
}

export const api: BridgeApi = window.api ?? fallbackApi

let saveTimer: ReturnType<typeof setTimeout> | undefined
function scheduleSave(s: AppState): void {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => void api.save(s), 300)
}

const today = (): string => dateStr()

// ---------- mutation helpers (operate on a draft clone) ----------

function ensureDay(d: AppState, fx: Fx): void {
  const t = today()
  const r = reconcileStreak(d.streak, t)
  if (r.frozenDays.length) {
    d.days = markFrozen(d.days, r.frozenDays)
    fx.toasts.push({
      icon: '❄️',
      title: `Streak freeze used (${r.frozenDays.length})`,
      body: `Your ${r.streak.count}-day streak survived. Hit today's goal to keep it going.`,
      tone: 'ice'
    })
  }
  if (r.lost > 0) {
    fx.toasts.push({ icon: '💔', title: `Lost a ${r.lost}-day streak`, body: 'Start a new one today.', tone: 'bad' })
  }
  d.streak = r.streak
  if (!d.quests || d.quests.date !== t) {
    d.quests = generateQuests(t, {
      dailyGoal: d.settings.dailyGoal,
      srsSize: Object.keys(d.srs).length,
      toolsUnlocked: unlockedTools(d).length
    })
  }
}

function questEvent(d: AppState, fx: Fx, ev: QuestEvent, n = 1): void {
  if (!d.quests) return
  const wasDone = allQuestsDone(d.quests)
  const { board, justCompleted } = applyQuestEvent(d.quests, ev, n)
  d.quests = board
  for (const q of justCompleted) fx.toasts.push({ icon: QUEST_ICON[q.type], title: 'Quest complete', body: questLabel(q), tone: 'good' })
  if (!wasDone && allQuestsDone(board) && !board.chestClaimed) {
    fx.toasts.push({ icon: '🎁', title: 'All quests done!', body: 'Open your chest on the Home screen.', tone: 'gold' })
  }
}

function checkGoal(d: AppState, fx: Fx): void {
  const t = today()
  const day = (d.days[t] ??= { xp: 0, goalMet: false })
  if (day.goalMet || day.xp < d.settings.dailyGoal) return
  day.goalMet = true
  const r = registerGoal(d.streak, t)
  d.streak = r.streak
  fx.confetti = true
  fx.toasts.push({ icon: '🔥', title: `Daily goal hit! ${r.streak.count}-day streak`, body: 'Streak is safe until tomorrow.', tone: 'fire' })
  if (r.earnedFreeze) fx.toasts.push({ icon: '❄️', title: 'Earned a streak freeze', body: 'It auto-protects a missed day.', tone: 'ice' })
}

function gainXP(d: AppState, fx: Fx, n: number): void {
  if (n <= 0) return
  const t = today()
  d.xp += n
  const day = (d.days[t] ??= { xp: 0, goalMet: false })
  day.xp += n
  fx.xp += n
  const hour = new Date().getHours()
  if (hour < 8 && hour >= 4) d.stats.early = true
  if (hour >= 23 || hour < 4) d.stats.night = true
  questEvent(d, fx, 'xp', n)
  checkGoal(d, fx)
}

// ---------- store ----------

interface Store {
  s: AppState
  ready: boolean
  view: View
  params: Record<string, string>
  toasts: Toast[]
  confetti: number
  xpPops: { id: number; n: number }[]
  init(): Promise<void>
  go(view: View, params?: Record<string, string>): void
  dismissToast(id: number): void
  clearPop(id: number): void
  tick(): void
  answerLessonQuestion(qid: string, correct: boolean): void
  completeLesson(id: string, r: { score?: number; total?: number; points?: number }): CompleteResult
  answerReview(qid: string, correct: boolean, practice: boolean): void
  answerArena(correct: boolean): void
  finishArenaRound(correct: number, total: number): boolean
  answerDaily(scenarioId: string, correct: boolean): void
  viewTool(id: string): void
  claimChest(): void
  saveNote(id: string, text: string): void
  updateSettings(p: Partial<Settings>): void
  reset(): void
}

let uid = 0
let lastDate = today()

export const useStore = create<Store>((set, get) => {
  function run(fn: (d: AppState, fx: Fx) => void): void {
    const prev = get().s
    const d = structuredClone(prev)
    const fx: Fx = { xp: 0, toasts: [], confetti: false }
    ensureDay(d, fx)
    fn(d, fx)

    const before = levelInfo(prev.xp)
    const after = levelInfo(d.xp)
    if (after.level > before.level) {
      fx.confetti = true
      fx.toasts.push({ icon: '🆙', title: `Level ${after.level}!`, body: `You're now a ${after.title}.`, tone: 'gold' })
    }
    for (const a of ACHIEVEMENTS) {
      if (!d.achievements[a.id] && a.check(d)) {
        d.achievements[a.id] = today()
        fx.toasts.push({ icon: a.icon, title: `Achievement: ${a.title}`, body: a.desc, tone: 'gold' })
      }
    }

    set((st) => ({
      s: d,
      toasts: [...st.toasts, ...fx.toasts.map((t) => ({ ...t, id: ++uid }))].slice(-6),
      confetti: fx.confetti ? st.confetti + 1 : st.confetti,
      xpPops: fx.xp > 0 ? [...st.xpPops, { id: ++uid, n: fx.xp }] : st.xpPops
    }))
    scheduleSave(d)
  }

  return {
    s: defaultState(),
    ready: false,
    view: 'home',
    params: {},
    toasts: [],
    confetti: 0,
    xpPops: [],

    async init() {
      const loaded = await api.load()
      set({ s: hydrate(loaded) })
      run(() => undefined)
      set({ ready: true })
      api.onNavigate((target) => {
        if (target.startsWith('mode:')) {
          const mode = target.slice(5) as Settings['startupMode']
          run((d) => void (d.settings.startupMode = mode))
        } else if ((VIEWS as string[]).includes(target)) {
          get().go(target as View)
        }
      })
    },

    go(view, params = {}) {
      set({ view, params })
    },

    dismissToast(id) {
      set((st) => ({ toasts: st.toasts.filter((t) => t.id !== id) }))
    },

    clearPop(id) {
      set((st) => ({ xpPops: st.xpPops.filter((p) => p.id !== id) }))
    },

    tick() {
      const t = today()
      if (t !== lastDate) {
        lastDate = t
        run(() => undefined)
      }
    },

    answerLessonQuestion(qid, correct) {
      run((d, fx) => {
        const seen = !!d.srs[qid]
        if (!seen) d.srs[qid] = introduceCard(correct, today())
        if (correct) gainXP(d, fx, seen ? 3 : 10)
      })
    },

    completeLesson(id, r) {
      let result: CompleteResult = { first: false, xp: 0, perfect: false, unitJustDone: false, newTools: [] }
      run((d, fx) => {
        const L = LESSON_BY_ID[id]
        if (!L) return
        const first = !d.completed[id]
        const unitWasDone = unitComplete(d, L.unit)
        const rec = d.completed[id] ?? { best: 0, attempts: 0, date: today() }
        rec.attempts++
        rec.best = Math.max(rec.best, r.total ? (r.score ?? 0) / r.total : 1)
        d.completed[id] = rec

        let xp = 0
        let perfect = false
        if (L.type === 'lesson') {
          if (first) xp += 20
          if (r.total && r.score === r.total) {
            perfect = true
            xp += first ? 20 : 5
            d.stats.perfects++
            questEvent(d, fx, 'perfect')
          }
        } else if (L.type === 'byte') {
          xp += first ? 10 + 5 * (r.points ?? 0) : 5
        } else {
          xp += first ? 60 : 10
          if (first) d.stats.labs++
        }
        gainXP(d, fx, xp)
        questEvent(d, fx, 'lesson')

        const unitJustDone = !unitWasDone && unitComplete(d, L.unit)
        const newTools = unitJustDone ? TOOLS.filter((t) => t.unit === L.unit.id).map((t) => t.name) : []
        if (unitJustDone) {
          fx.confetti = true
          fx.toasts.push({
            icon: L.unit.icon,
            title: `Unit complete: ${L.unit.title}`,
            body: newTools.length ? `Unlocked: ${newTools.join(', ')}` : undefined,
            tone: 'gold'
          })
        }
        result = { first, xp, perfect, unitJustDone, newTools }
      })
      return result
    },

    answerReview(qid, correct, practice) {
      run((d, fx) => {
        if (practice) {
          if (correct) gainXP(d, fx, 2)
          return
        }
        d.srs[qid] = answerCard(d.srs[qid], correct, today())
        d.stats.reviews++
        gainXP(d, fx, correct ? 5 : 1)
        if (correct) questEvent(d, fx, 'review_correct')
      })
    },

    answerArena(correct) {
      run((d, fx) => {
        if (!correct) return
        d.arena.correct++
        gainXP(d, fx, 8)
        questEvent(d, fx, 'arena_correct')
      })
    },

    finishArenaRound(correct, total) {
      const win = total > 0 && correct >= Math.ceil(total * 0.8)
      run((d, fx) => {
        d.arena.played++
        if (win) {
          d.arena.wins++
          gainXP(d, fx, 15)
          fx.toasts.push({ icon: '⚔️', title: 'Round won! +15 XP', tone: 'good' })
        }
      })
      return win
    },

    answerDaily(scenarioId, correct) {
      run((d, fx) => {
        const t = today()
        if (d.daily?.date === t) return
        d.daily = { date: t, scenarioId, correct }
        if (correct) d.stats.dailyWins++
        gainXP(d, fx, correct ? 25 : 5)
        questEvent(d, fx, 'daily')
      })
    },

    viewTool(id) {
      run((d, fx) => {
        if (!d.toolsViewed[id]) {
          d.toolsViewed[id] = true
          gainXP(d, fx, 5)
        }
        questEvent(d, fx, 'tool_view')
      })
    },

    claimChest() {
      run((d, fx) => {
        if (!d.quests || d.quests.chestClaimed || !allQuestsDone(d.quests)) return
        d.quests.chestClaimed = true
        gainXP(d, fx, 40)
        fx.confetti = true
        if (Math.random() < 0.25 && d.streak.freezes < MAX_FREEZES) {
          d.streak.freezes++
          fx.toasts.push({ icon: '❄️', title: 'Chest bonus: streak freeze!', tone: 'ice' })
        }
      })
    },

    saveNote(id, text) {
      run((d) => void (d.notes[id] = text))
    },

    updateSettings(p) {
      if (p.startupMode && p.startupMode !== get().s.settings.startupMode) void api.setStartupMode(p.startupMode)
      run((d, fx) => {
        Object.assign(d.settings, p)
        if (p.dailyGoal) checkGoal(d, fx)
      })
    },

    reset() {
      const settings = get().s.settings
      set({ s: { ...defaultState(), settings } })
      run(() => undefined)
    }
  }
})
