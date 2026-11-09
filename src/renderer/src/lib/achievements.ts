import type { AppState } from '../../../shared/types'
import { TOOLS } from '../content/tools'
import { levelInfo } from './levels'
import { completedUnitIds, LAB_COUNT, unlockedTools } from './progress'

export interface Achievement {
  id: string
  icon: string
  title: string
  desc: string
  check: (s: AppState) => boolean
}

const unitDone = (id: string) => (s: AppState) => completedUnitIds(s).includes(id)

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_lesson', icon: '🎓', title: 'Hello, World', desc: 'Complete your first lesson', check: (s) => Object.keys(s.completed).length >= 1 },
  { id: 'streak3', icon: '🔥', title: 'Warming Up', desc: 'Reach a 3-day streak', check: (s) => s.streak.best >= 3 },
  { id: 'streak7', icon: '🔥', title: 'Week Warrior', desc: 'Reach a 7-day streak', check: (s) => s.streak.best >= 7 },
  { id: 'streak30', icon: '🌋', title: 'Unstoppable', desc: 'Reach a 30-day streak', check: (s) => s.streak.best >= 30 },
  { id: 'streak100', icon: '☄️', title: 'Five Nines of Discipline', desc: 'Reach a 100-day streak', check: (s) => s.streak.best >= 100 },
  { id: 'perfect', icon: '💯', title: 'Flawless', desc: 'Score 100% on a quiz', check: (s) => s.stats.perfects >= 1 },
  { id: 'perfect10', icon: '🎯', title: 'Sharpshooter', desc: 'Score 100% on 10 quizzes', check: (s) => s.stats.perfects >= 10 },
  { id: 'lab1', icon: '🧪', title: 'Lab Rat', desc: 'Complete your first hands-on lab', check: (s) => s.stats.labs >= 1 },
  { id: 'labs_all', icon: '🔬', title: 'Mad Scientist', desc: 'Complete every lab', check: (s) => s.stats.labs >= LAB_COUNT },
  { id: 'unit_u1', icon: '🖥️', title: 'Single Point of Success', desc: 'Finish Foundations', check: unitDone('u1') },
  { id: 'unit_u4', icon: '⚖️', title: 'Traffic Controller', desc: 'Finish the Traffic unit', check: unitDone('u4') },
  { id: 'unit_u5', icon: '🗄️', title: 'Data Modeler', desc: 'Finish Data Modeling', check: unitDone('u5') },
  { id: 'unit_u7', icon: '⚡', title: 'Cache Money', desc: 'Finish Caching', check: unitDone('u7') },
  { id: 'unit_u8', icon: '🧬', title: 'Shard Happens', desc: 'Finish Replication & Sharding', check: unitDone('u8') },
  { id: 'unit_u9', icon: '🏛️', title: 'Architect', desc: 'Finish the Capstone', check: unitDone('u9') },
  { id: 'review50', icon: '🧠', title: 'Long-Term Memory', desc: 'Answer 50 review cards', check: (s) => s.stats.reviews >= 50 },
  { id: 'arena10', icon: '⚔️', title: 'Tradeoff Thinker', desc: 'Win 10 Tradeoff Arena rounds', check: (s) => s.arena.wins >= 10 },
  { id: 'daily7', icon: '🚨', title: 'On Call', desc: 'Solve 7 Daily Incidents', check: (s) => s.stats.dailyWins >= 7 },
  { id: 'tools_all', icon: '🧰', title: 'Collector', desc: 'Unlock every tool card', check: (s) => unlockedTools(s).length >= TOOLS.length },
  { id: 'level5', icon: '⭐', title: 'Rising Star', desc: 'Reach level 5', check: (s) => levelInfo(s.xp).level >= 5 },
  { id: 'level10', icon: '🌟', title: 'Staff Material', desc: 'Reach level 10', check: (s) => levelInfo(s.xp).level >= 10 },
  { id: 'early', icon: '🌅', title: 'Early Bird', desc: 'Study before 8am', check: (s) => s.stats.early },
  { id: 'night', icon: '🦉', title: 'Night Owl', desc: 'Study after 11pm', check: (s) => s.stats.night }
]
