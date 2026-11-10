// ---------- Persisted progress ----------

/** How hard the app works to get you back each day (Settings → Startup & reminders). */
export type StartupMode = 'tray' | 'window' | 'running' | 'off'

export interface Settings {
  dailyGoal: number
  /** "HH:MM", local time */
  reminderTime: string
  startupMode: StartupMode
  dangerAlert: boolean
  closeToTray: boolean
  /** UI sound effects (clicks, right/wrong answers, level-ups) */
  sounds: boolean
  /** soft tick when hovering buttons (only if sounds is on) */
  hoverSounds: boolean
  /** background music level, 0–1 of the files' own loudness */
  musicVolume: number
  musicMuted: boolean
}

export interface DayRecord {
  xp: number
  goalMet: boolean
  frozen?: boolean
}

export interface SrsCard {
  box: number
  /** YYYY-MM-DD */
  due: string
}

export type QuestType = 'xp' | 'lesson' | 'review' | 'arena' | 'perfect' | 'daily' | 'tool'

export interface Quest {
  type: QuestType
  target: number
  progress: number
}

export interface QuestBoard {
  date: string
  list: Quest[]
  chestClaimed: boolean
}

export interface Streak {
  count: number
  best: number
  lastGoalDate: string | null
  freezes: number
}

export interface AppState {
  version: 1
  createdAt: string
  xp: number
  completed: Record<string, { best: number; attempts: number; date: string }>
  srs: Record<string, SrsCard>
  streak: Streak
  days: Record<string, DayRecord>
  quests: QuestBoard | null
  daily: { date: string; scenarioId: string; correct: boolean } | null
  arena: { wins: number; played: number; correct: number }
  stats: {
    reviews: number
    dailyWins: number
    perfects: number
    labs: number
    early: boolean
    night: boolean
  }
  toolsViewed: Record<string, true>
  achievements: Record<string, string>
  notes: Record<string, string>
  settings: Settings
  /** Level-up waiting to be celebrated once the user leaves an activity. */
  pendingLevelUp?: { from: number; to: number } | null
}

// ---------- Content ----------

export interface Question {
  q: string
  options: string[]
  answer: number
  explain: string
}

export interface Card {
  title: string
  /** trusted HTML authored in content files */
  body: string
}

interface LessonBase {
  id: string
  title: string
  minutes: number
}

export interface ConceptLesson extends LessonBase {
  type: 'lesson'
  cards: Card[]
  quiz: Question[]
}

export interface ByteLesson extends LessonBase {
  type: 'byte'
  prompt: string
  hints: string[]
  /** trusted HTML */
  model: string
  points: string[]
}

export interface LabStep {
  title: string
  body: string
  code?: string
}

export interface LabLesson extends LessonBase {
  type: 'lab'
  intro: string
  steps: LabStep[]
  outro: string
}

export type Lesson = ConceptLesson | ByteLesson | LabLesson

export interface Unit {
  id: string
  title: string
  subtitle: string
  icon: string
  color: string
  lessons: Lesson[]
}

export interface ScenarioOption {
  text: string
  correct?: boolean
  why: string
}

export interface Scenario {
  id: string
  unit: string
  title: string
  prompt: string
  options: ScenarioOption[]
}

export interface Tool {
  id: string
  name: string
  /** must match a name in content/toolbox/categories.ts (which sets the phase) */
  category: string
  /** the unit this tool is most relevant to */
  unit: string
  /** other units where it also comes up */
  alsoIn?: string[]
  icon: string
  tagline: string
  /** 2–4 plain-English sentences: what it is and how it fits into a system */
  summary: string
  strengths: string[]
  weaknesses: string[]
  useWhen: string[]
  avoidWhen: string[]
  alternatives: string[]
}

export interface Comparison {
  id: string
  unit: string
  title: string
  columns: string[]
  rows: string[][]
  verdict: string
}

// ---------- IPC bridge ----------

export interface AppInfo {
  version: string
  isPackaged: boolean
  openAtLogin: boolean
}

export interface BridgeApi {
  load(): Promise<AppState | null>
  save(state: AppState): Promise<void>
  setStartupMode(mode: StartupMode): Promise<void>
  testNotification(): Promise<void>
  getInfo(): Promise<AppInfo>
  onNavigate(cb: (view: string) => void): () => void
  /** Custom title-bar buttons (the window is frameless). */
  windowControl(action: WindowAction): void
  isMaximized(): Promise<boolean>
  onMaximizedChange(cb: (maximized: boolean) => void): () => void
  /** Window shown vs hidden to the tray (background music pauses when hidden). */
  isWindowVisible(): Promise<boolean>
  onWindowVisibility(cb: (visible: boolean) => void): () => void
}

export type WindowAction = 'minimize' | 'maximize' | 'close'
