import type { AppState } from '../shared/types'
import { addDays, dateStr, minutesOf } from '../shared/dates'

export interface Summary {
  today: string
  goalMet: boolean
  xpToday: number
  goal: number
  streak: number
  atRisk: boolean
  due: number
}

export function summarize(state: AppState | null, now: Date = new Date()): Summary {
  const today = dateStr(now)
  const yesterday = addDays(today, -1)
  const day = state?.days?.[today]
  const last = state?.streak?.lastGoalDate ?? null
  const count = state?.streak?.count ?? 0
  const alive = last === today || last === yesterday
  return {
    today,
    goalMet: !!day?.goalMet,
    xpToday: day?.xp ?? 0,
    goal: state?.settings?.dailyGoal ?? 30,
    streak: alive ? count : 0,
    atRisk: last === yesterday && count > 0,
    due: Object.values(state?.srs ?? {}).filter((c) => c.due <= today).length
  }
}

export type ReminderSent = { reminder?: string; danger?: string; login?: string }
export type ReminderKind = 'reminder' | 'danger' | null

/** Late-night "streak in danger" time: reminder + 90 min, never before 21:00, never after 23:00. */
export function dangerMinutes(reminderTime: string): number {
  return Math.min(23 * 60, Math.max(minutesOf(reminderTime) + 90, 21 * 60))
}

/** Pure decision: which notification (if any) should fire right now. */
export function decideReminder(state: AppState | null, sent: ReminderSent, now: Date = new Date()): ReminderKind {
  if (!state || state.settings.startupMode === 'off') return null
  const sum = summarize(state, now)
  if (sum.goalMet) return null
  const mins = now.getHours() * 60 + now.getMinutes()
  if (state.settings.dangerAlert && sum.atRisk && mins >= dangerMinutes(state.settings.reminderTime) && sent.danger !== sum.today) {
    return 'danger'
  }
  if (mins >= minutesOf(state.settings.reminderTime) && sent.reminder !== sum.today && sent.danger !== sum.today) {
    return 'reminder'
  }
  return null
}

const TEASERS = [
  "Quick: why isn't replication a backup?",
  'Round robin or least connections when some requests take 30 seconds?',
  'Your cache key just expired and 20k requests hit the DB. Now what?',
  'Index on (country, city). Does WHERE city = ? use it?',
  '99.99% uptime allows how many minutes of downtime per month?',
  'Users get logged out after you add a second server. Why?',
  'Cassandra or Postgres for a payments ledger?',
  'Range sharding or hash sharding for time-series writes?',
  'When should a monolith actually be split?',
  'Redis or Memcached for a leaderboard?',
  'Sync or async replication: which can lose writes on failover?',
  'L4 or L7 load balancer for path-based routing?',
  'What does a load balancer health check actually check?',
  'Kafka or RabbitMQ when five teams need to replay the same events?'
]

export function teaser(today: string): string {
  let h = 0
  for (const ch of today) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return TEASERS[h % TEASERS.length]
}

export function reminderText(kind: Exclude<ReminderKind, null>, sum: Summary): { title: string; body: string } {
  if (kind === 'danger') {
    return {
      title: `🔥 Your ${sum.streak}-day streak ends at midnight`,
      body: `${Math.max(0, sum.goal - sum.xpToday)} XP to go. One quick lesson or review saves it.`
    }
  }
  const extra = sum.due > 0 ? ` ${sum.due} review card${sum.due === 1 ? '' : 's'} due.` : ''
  return {
    title: sum.streak > 0 ? `🧠 Keep the ${sum.streak}-day streak going` : '🧠 Time for some system design',
    body: `${teaser(sum.today)}${extra}`
  }
}
