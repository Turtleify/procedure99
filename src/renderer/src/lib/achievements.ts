import type { AppState } from '../../../shared/types'
import { CURRICULUM } from '../content/curriculum'
import { DESIGN_PROBLEMS, type Difficulty } from '../content/design-problems'
import { TOOLS } from '../content/tools'
import { TOOL_TRACK } from '../content/tools-track'
import { levelInfo } from './levels'
import { ALL_LESSONS, completedModuleIds, completedUnitIds, LAB_COUNT, LESSON_BY_ID, TOOL_LESSONS } from './progress'

export type AchievementGroup = 'Learning' | 'Tools' | 'Practice' | 'Design Lab' | 'Habits' | 'Milestones'
export const ACHIEVEMENT_GROUPS: AchievementGroup[] = ['Learning', 'Tools', 'Practice', 'Design Lab', 'Habits', 'Milestones']

export interface Achievement {
  /** stable: saved in progress files, never rename */
  id: string
  icon: string
  title: string
  desc: string
  group: AchievementGroup
  check: (s: AppState) => boolean
  /** [current, target] for count-based trophies (shown as a progress bar while locked) */
  progress?: (s: AppState) => [number, number]
}

// ───────── helpers ─────────

const unitDone = (id: string) => (s: AppState) => completedUnitIds(s).includes(id)
const toolsRead = (s: AppState): number => TOOLS.filter((t) => s.toolsViewed[t.id]).length
const lessonsDone = (s: AppState): number => Object.keys(s.completed).filter((id) => LESSON_BY_ID[id]).length
const bytesDone = (s: AppState): number => Object.keys(s.completed).filter((id) => LESSON_BY_ID[id]?.type === 'byte').length
const solved = (s: AppState): typeof DESIGN_PROBLEMS => DESIGN_PROBLEMS.filter((p) => s.designs?.[p.id]?.solved)
const solvedAll = (d: Difficulty) => (s: AppState) => DESIGN_PROBLEMS.filter((p) => p.difficulty === d).every((p) => s.designs?.[p.id]?.solved)
const goalDays = (s: AppState): number => Object.values(s.days).filter((d) => d.goalMet).length
const bestDay = (s: AppState): number => Math.max(0, ...Object.values(s.days).map((d) => d.xp))
const masteredCount = (s: AppState): number => Object.keys(s.mastered ?? {}).length
const topBoxCards = (s: AppState): number => Object.values(s.srs).filter((c) => c.box >= 6).length
const notesWritten = (s: AppState): number => Object.values(s.notes).filter((n) => n.trim()).length
const weekday = (date: string): number => new Date(`${date}T12:00:00`).getDay()

/** Count-based trophy: earned at `target`, with a progress bar until then. */
function count(
  id: string,
  icon: string,
  title: string,
  desc: string,
  group: AchievementGroup,
  value: (s: AppState) => number,
  target: number | (() => number)
): Achievement {
  const t = (): number => (typeof target === 'number' ? target : target())
  return { id, icon, title, desc, group, check: (s) => value(s) >= t(), progress: (s) => [Math.min(value(s), t()), t()] }
}

export const ACHIEVEMENTS: Achievement[] = [
  // ───────── Learning ─────────
  { id: 'first_lesson', icon: 'graduation-cap', title: 'Hello, World', desc: 'Complete your first lesson', group: 'Learning', check: (s) => lessonsDone(s) >= 1 },
  count('lessons10', 'book-open', 'Bookworm', 'Complete 10 lessons', 'Learning', lessonsDone, 10),
  count('lessons50', 'notebook', 'Scholar', 'Complete 50 lessons', 'Learning', lessonsDone, 50),
  count('lessons_all', 'medal', 'Completionist', 'Complete every lesson in both tracks', 'Learning', lessonsDone, () => ALL_LESSONS.length),
  { id: 'perfect', icon: 'target', title: 'Flawless', desc: 'Score 100% on a quiz', group: 'Learning', check: (s) => s.stats.perfects >= 1 },
  count('perfect10', 'crosshair', 'Sharpshooter', 'Score 100% on 10 quizzes', 'Learning', (s) => s.stats.perfects, 10),
  count('perfect25', 'crosshair', 'Deadeye', 'Score 100% on 25 quizzes', 'Learning', (s) => s.stats.perfects, 25),
  count('bytes5', 'mic', 'Interview Ready', 'Finish 5 Interview Bytes', 'Learning', bytesDone, 5),
  { id: 'lab1', icon: 'flask', title: 'Lab Rat', desc: 'Complete your first hands-on lab', group: 'Learning', check: (s) => s.stats.labs >= 1 },
  count('labs_all', 'microscope', 'Mad Scientist', 'Complete every lab', 'Learning', (s) => s.stats.labs, LAB_COUNT),
  { id: 'unit_u1', icon: 'server', title: 'Single Point of Success', desc: 'Finish Foundations', group: 'Learning', check: unitDone('u1') },
  { id: 'unit_u2', icon: 'clipboard', title: 'Requirements Gatherer', desc: 'Finish the Requirements unit', group: 'Learning', check: unitDone('u2') },
  { id: 'unit_u3', icon: 'blocks', title: 'Monolith Breaker', desc: 'Finish Architecture & Scaling', group: 'Learning', check: unitDone('u3') },
  { id: 'unit_u4', icon: 'network', title: 'Traffic Controller', desc: 'Finish the Traffic unit', group: 'Learning', check: unitDone('u4') },
  { id: 'unit_u5', icon: 'database', title: 'Data Modeler', desc: 'Finish Data Modeling', group: 'Learning', check: unitDone('u5') },
  { id: 'unit_u6', icon: 'search', title: 'Index Finder', desc: 'Finish the Indexes unit', group: 'Learning', check: unitDone('u6') },
  { id: 'unit_u7', icon: 'zap', title: 'Cache Money', desc: 'Finish Caching', group: 'Learning', check: unitDone('u7') },
  { id: 'unit_u8', icon: 'split', title: 'Shard Happens', desc: 'Finish Replication & Sharding', group: 'Learning', check: unitDone('u8') },
  { id: 'unit_u9', icon: 'landmark', title: 'Architect', desc: 'Finish the Capstone', group: 'Learning', check: unitDone('u9') },
  count('concepts_all', 'layers', 'The Full Picture', 'Finish every concept unit', 'Learning', (s) => completedUnitIds(s).length, CURRICULUM.length),

  // ───────── Tools ─────────
  { id: 'tools_first', icon: 'wrench', title: 'Hands On', desc: 'Finish your first Tools-track lesson', group: 'Tools', check: (s) => TOOL_LESSONS.some((l) => s.completed[l.id]) },
  { id: 'tools_module', icon: 'badge-check', title: 'Certified', desc: 'Finish a Tools-track module', group: 'Tools', check: (s) => completedModuleIds(s).length >= 1 },
  count('tools_half', 'hammer', 'Power User', 'Finish 7 Tools-track modules', 'Tools', (s) => completedModuleIds(s).length, 7),
  count('toolsmith', 'trophy', 'Toolsmith', 'Finish every Tools-track module', 'Tools', (s) => completedModuleIds(s).length, () => TOOL_TRACK.length),
  count('tools_all', 'wrench', 'Collector', 'Read 25 Toolbox entries', 'Tools', toolsRead, 25),
  count('tools_100', 'book-open', 'Walking Encyclopedia', 'Read 100 Toolbox entries', 'Tools', toolsRead, 100),
  count('tools_every', 'gem', 'Encyclopedic', 'Read every Toolbox entry', 'Tools', toolsRead, () => TOOLS.length),

  // ───────── Practice ─────────
  count('review50', 'brain', 'Long-Term Memory', 'Answer 50 review cards', 'Practice', (s) => s.stats.reviews, 50),
  count('review250', 'brain', 'Elephant Memory', 'Answer 250 review cards', 'Practice', (s) => s.stats.reviews, 250),
  count('review1000', 'brain', 'Total Recall', 'Answer 1,000 review cards', 'Practice', (s) => s.stats.reviews, 1000),
  count('srs_top50', 'lock-keyhole', 'Locked In', 'Get 50 cards to the top Review box', 'Practice', topBoxCards, 50),
  { id: 'mastered1', icon: 'star', title: 'Gold Standard', desc: 'Master a node on your skill tree', group: 'Practice', check: (s) => masteredCount(s) >= 1 },
  count('mastered5', 'star', 'Midas Touch', 'Master 5 skill-tree nodes', 'Practice', masteredCount, 5),
  { id: 'arena_first', icon: 'swords', title: 'Opening Move', desc: 'Win a Tradeoff Arena round', group: 'Practice', check: (s) => s.arena.wins >= 1 },
  count('arena10', 'swords', 'Tradeoff Thinker', 'Win 10 Tradeoff Arena rounds', 'Practice', (s) => s.arena.wins, 10),
  count('arena50', 'scale', 'Tradeoff Master', 'Win 50 Tradeoff Arena rounds', 'Practice', (s) => s.arena.wins, 50),
  count('daily7', 'siren', 'On Call', 'Solve 7 Daily Incidents', 'Practice', (s) => s.stats.dailyWins, 7),
  count('daily30', 'siren', 'Incident Commander', 'Solve 30 Daily Incidents', 'Practice', (s) => s.stats.dailyWins, 30),
  count('notes5', 'pen-tool', 'Note Taker', 'Write notes on 5 lessons', 'Practice', notesWritten, 5),

  // ───────── Design Lab ─────────
  { id: 'design_first', icon: 'pen-tool', title: 'On the Whiteboard', desc: 'Solve your first Design Lab problem', group: 'Design Lab', check: (s) => solved(s).length >= 1 },
  {
    id: 'design_firsttry',
    icon: 'target',
    title: 'Measure Twice',
    desc: 'Solve a Design Lab problem on your first run',
    group: 'Design Lab',
    check: (s) => DESIGN_PROBLEMS.some((p) => s.designs?.[p.id]?.solved && s.designs[p.id].runs === 1)
  },
  count('design_5', 'workflow', 'Systems Thinker', 'Solve 5 Design Lab problems', 'Design Lab', (s) => solved(s).length, 5),
  { id: 'design_easy_all', icon: 'check', title: 'Warm-Up Done', desc: 'Solve every Easy problem', group: 'Design Lab', check: solvedAll('Easy') },
  { id: 'design_medium_all', icon: 'badge-check', title: 'Mid-Level Sweep', desc: 'Solve every Medium problem', group: 'Design Lab', check: solvedAll('Medium') },
  { id: 'design_hard', icon: 'rocket', title: 'Principal Material', desc: 'Solve a Hard Design Lab problem', group: 'Design Lab', check: (s) => solved(s).some((p) => p.difficulty === 'Hard') },
  count('design_all', 'landmark', 'Whiteboard Wizard', 'Solve every Design Lab problem', 'Design Lab', (s) => solved(s).length, () => DESIGN_PROBLEMS.length),

  // ───────── Habits ─────────
  count('streak3', 'flame', 'Warming Up', 'Reach a 3-day streak', 'Habits', (s) => s.streak.best, 3),
  count('streak7', 'flame', 'Week Warrior', 'Reach a 7-day streak', 'Habits', (s) => s.streak.best, 7),
  count('streak14', 'flame', 'Fortnight', 'Reach a 14-day streak', 'Habits', (s) => s.streak.best, 14),
  count('streak30', 'mountain', 'Unstoppable', 'Reach a 30-day streak', 'Habits', (s) => s.streak.best, 30),
  count('streak100', 'orbit', 'Five Nines of Discipline', 'Reach a 100-day streak', 'Habits', (s) => s.streak.best, 100),
  count('streak365', 'crown', 'A Year of Uptime', 'Reach a 365-day streak', 'Habits', (s) => s.streak.best, 365),
  count('goals10', 'calendar-check', 'Creature of Habit', 'Hit your daily goal on 10 days', 'Habits', goalDays, 10),
  count('goals50', 'calendar-check', 'Clockwork', 'Hit your daily goal on 50 days', 'Habits', goalDays, 50),
  {
    id: 'overachiever',
    icon: 'chevrons-up',
    title: 'Overachiever',
    desc: 'Earn double your daily goal in one day',
    group: 'Habits',
    check: (s) => Object.values(s.days).some((d) => d.xp >= 2 * s.settings.dailyGoal)
  },
  count('marathon', 'timer', 'Marathon', 'Earn 500 XP in one day', 'Habits', bestDay, 500),
  {
    id: 'weekend',
    icon: 'sunrise',
    title: 'Weekend Warrior',
    desc: 'Hit your daily goal on a Saturday and a Sunday',
    group: 'Habits',
    check: (s) => {
      const met = Object.entries(s.days).filter(([, d]) => d.goalMet).map(([date]) => weekday(date))
      return met.includes(6) && met.includes(0)
    }
  },
  { id: 'freeze_saved', icon: 'snowflake', title: 'Saved by the Ice', desc: 'Have a streak freeze protect a missed day', group: 'Habits', check: (s) => Object.values(s.days).some((d) => d.frozen) },
  { id: 'early', icon: 'sunrise', title: 'Early Bird', desc: 'Study before 8am', group: 'Habits', check: (s) => s.stats.early },
  { id: 'night', icon: 'moon', title: 'Night Owl', desc: 'Study after 11pm', group: 'Habits', check: (s) => s.stats.night },

  // ───────── Milestones ─────────
  count('level3', 'star', 'Getting Started', 'Reach level 3', 'Milestones', (s) => levelInfo(s.xp).level, 3),
  count('level5', 'star', 'Rising Star', 'Reach level 5', 'Milestones', (s) => levelInfo(s.xp).level, 5),
  count('level10', 'award', 'Staff Material', 'Reach level 10', 'Milestones', (s) => levelInfo(s.xp).level, 10),
  count('level15', 'crown', 'Distinguished', 'Reach level 15', 'Milestones', (s) => levelInfo(s.xp).level, 15),
  count('level20', 'gem', 'Grand Architect', 'Reach level 20', 'Milestones', (s) => levelInfo(s.xp).level, 20),
  count('level30', 'sparkles', 'Greatest of All Time', 'Reach level 30 and become the G.O.A.T. Architect', 'Milestones', (s) => levelInfo(s.xp).level, 30),
  count('xp1000', 'gauge', 'Four Digits', 'Earn 1,000 XP in total', 'Milestones', (s) => s.xp, 1000),
  count('xp10000', 'gauge', 'Five Digits', 'Earn 10,000 XP in total', 'Milestones', (s) => s.xp, 10000)
]
