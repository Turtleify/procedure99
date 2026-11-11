import { create } from 'zustand'
import type { AppState, BridgeApi, Diagram, Settings } from '../../shared/types'
import { dateStr } from '../../shared/dates'
import { defaultState, hydrate } from '../../shared/defaults'
import { DIFFICULTY_XP, PROBLEM_BY_ID } from './content/design-problems'
import { TOOLS } from './content/tools'
import { ACHIEVEMENTS } from './lib/achievements'
import { levelInfo } from './lib/levels'
import { LESSON_BY_ID, moduleCode, moduleUnlocked, unitComplete } from './lib/progress'
import { TOOL_TRACK } from './content/tools-track'
import { earnsMastery, TREE_NODES } from './lib/skilltree'
import { allQuestsDone, applyQuestEvent, generateQuests, QUEST_ICON, questLabel, type QuestEvent } from './lib/quests'
import { answerCard, introduceCard } from './lib/srs'
import { markFrozen, MAX_FREEZES, reconcileStreak, registerGoal } from './lib/streak'

export type View = 'home' | 'path' | 'lesson' | 'review' | 'arena' | 'daily' | 'lab' | 'toolbox' | 'trophies' | 'settings'
const VIEWS: View[] = ['home', 'path', 'lesson', 'review', 'arena', 'daily', 'lab', 'toolbox', 'trophies', 'settings']

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
  /** how many Toolbox entries relate to the unit just finished (0 unless unitJustDone) */
  unitTools: number
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
  onNavigate: () => () => undefined,
  windowControl: () => undefined,
  isMaximized: async () => false,
  onMaximizedChange: () => () => undefined,
  isWindowVisible: async () => true,
  onWindowVisibility: () => () => undefined
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
      icon: 'snowflake',
      title: `Streak freeze used (${r.frozenDays.length})`,
      body: `Your ${r.streak.count}-day streak survived. Hit today's goal to keep it going.`,
      tone: 'ice'
    })
  }
  if (r.lost > 0) {
    fx.toasts.push({ icon: 'heart-crack', title: `Lost a ${r.lost}-day streak`, body: 'Start a new one today.', tone: 'bad' })
  }
  d.streak = r.streak
  if (!d.quests || d.quests.date !== t) {
    d.quests = generateQuests(t, {
      dailyGoal: d.settings.dailyGoal,
      srsSize: Object.keys(d.srs).length,
      toolsUnlocked: TOOLS.length
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
    fx.toasts.push({ icon: 'gift', title: 'All quests done!', body: 'Open your chest on the Home screen.', tone: 'gold' })
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
  fx.toasts.push({ icon: 'flame', title: `Daily goal hit! ${r.streak.count}-day streak`, body: 'Streak is safe until tomorrow.', tone: 'fire' })
  if (r.earnedFreeze) fx.toasts.push({ icon: 'snowflake', title: 'Earned a streak freeze', body: 'It auto-protects a missed day.', tone: 'ice' })
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
  /** Vocabulary card (tools / terms / acronyms). New cards join the deck; due cards move boxes; others are cram practice. */
  answerVocab(id: string, correct: boolean): void
  answerArena(correct: boolean): void
  finishArenaRound(correct: number, total: number): boolean
  answerDaily(scenarioId: string, correct: boolean): void
  viewTool(id: string): void
  /** Design Lab: keep the user's canvas (no XP, no toasts) */
  saveDesign(id: string, diagram: Diagram): void
  /** Design Lab: record a check run; returns XP earned (first full solve only) */
  submitDesign(id: string, passed: number, total: number): number
  claimChest(): void
  dismissLevelUp(): void
  celebrate(): void
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
      // Celebrated later by <LevelUpModal>, once the user is out of the activity.
      d.pendingLevelUp = { from: d.pendingLevelUp?.from ?? before.level, to: after.level }
    }
    // skill tree: mastery is saved the first time it's earned and kept from then on
    for (const n of TREE_NODES) {
      if (!d.mastered?.[n.id] && earnsMastery(d, n.unit)) {
        ;(d.mastered ??= {})[n.id] = today()
        fx.toasts.push({ icon: 'star', title: `Mastered: ${n.unit.title}`, body: 'Gold on your skill tree. It stays for good.', tone: 'gold' })
      }
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

    dismissLevelUp() {
      run((d) => void (d.pendingLevelUp = null))
    },

    celebrate() {
      set((st) => ({ confetti: st.confetti + 1 }))
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
      let result: CompleteResult = { first: false, xp: 0, perfect: false, unitJustDone: false, unitTools: 0 }
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
        const isModule = L.track === 'tools'
        const unitTools = !unitJustDone
          ? 0
          : isModule
            ? (L.unit.teaches ?? []).length
            : TOOLS.filter((t) => t.unit === L.unit.id || t.alsoIn?.includes(L.unit.id)).length
        if (unitJustDone) {
          fx.confetti = true
          fx.toasts.push({
            icon: L.unit.icon,
            title: `${isModule ? 'Module' : 'Unit'} complete: ${L.unit.title}`,
            body: !unitTools
              ? undefined
              : isModule
                ? `${unitTools} tools marked Learned in your Toolbox.`
                : `Explore its ${unitTools} real-world tools in the Toolbox.`,
            tone: 'gold'
          })
        }
        // finishing a concept unit can open Tools-track modules
        if (unitJustDone && !isModule) {
          for (const m of TOOL_TRACK) {
            if (m.requires?.includes(L.unit.id) && moduleUnlocked(d, m)) {
              fx.toasts.push({ icon: m.icon, title: `Tools track unlocked: ${moduleCode(m)}`, body: `${m.title}: ${m.subtitle}`, tone: 'good' })
            }
          }
        }
        result = { first, xp, perfect, unitJustDone, unitTools }
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

    answerVocab(id, correct) {
      run((d, fx) => {
        const t = today()
        const card = d.srs[id]
        if (!card) {
          d.srs[id] = introduceCard(correct, t)
          if (correct) gainXP(d, fx, 4)
          return
        }
        if (card.due > t) {
          // not due: practice only, so cramming doesn't wreck the schedule
          if (correct) gainXP(d, fx, 1)
          return
        }
        d.srs[id] = answerCard(card, correct, t)
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
          fx.toasts.push({ icon: 'swords', title: 'Round won! +15 XP', tone: 'good' })
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

    saveDesign(id, diagram) {
      const s = get().s
      const rec = s.designs?.[id] ?? { diagram, runs: 0, best: 0 }
      const next = { ...s, designs: { ...s.designs, [id]: { ...rec, diagram } } }
      set({ s: next })
      scheduleSave(next)
    },

    submitDesign(id, passed, total) {
      let earned = 0
      run((d, fx) => {
        const p = PROBLEM_BY_ID[id]
        if (!p) return
        const designs = (d.designs ??= {})
        const rec = (designs[id] ??= { diagram: { nodes: [], edges: [] }, runs: 0, best: 0 })
        rec.runs++
        rec.best = Math.max(rec.best, passed)
        if (passed === total && !rec.solved) {
          rec.solved = today()
          earned = DIFFICULTY_XP[p.difficulty]
          gainXP(d, fx, earned)
          fx.confetti = true
          fx.toasts.push({ icon: 'pen-tool', title: `Solved: ${p.title}`, body: `+${earned} XP. The reference design is unlocked.`, tone: 'gold' })
        }
      })
      return earned
    },

    claimChest() {
      run((d, fx) => {
        if (!d.quests || d.quests.chestClaimed || !allQuestsDone(d.quests)) return
        d.quests.chestClaimed = true
        gainXP(d, fx, 40)
        fx.confetti = true
        if (Math.random() < 0.25 && d.streak.freezes < MAX_FREEZES) {
          d.streak.freezes++
          fx.toasts.push({ icon: 'snowflake', title: 'Chest bonus: streak freeze!', tone: 'ice' })
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
