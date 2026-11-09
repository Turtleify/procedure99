import { useEffect } from 'react'
import { dateStr } from '../../shared/dates'
import { Bar } from './components/bits'
import { Confetti, Toasts, XpPops } from './components/Overlays'
import { levelInfo } from './lib/levels'
import { dueIds } from './lib/srs'
import { useStore, type View } from './store'
import { Home } from './views/Home'
import { LessonPlayer } from './views/LessonPlayer'
import { Path } from './views/Path'
import { Arena, DailyIncident, Review } from './views/Practice'
import { Settings } from './views/Settings'
import { Toolbox } from './views/Toolbox'
import { Trophies } from './views/Trophies'

const NAV: { view: View; icon: string; label: string }[] = [
  { view: 'home', icon: '🏠', label: 'Home' },
  { view: 'path', icon: '🗺️', label: 'Path' },
  { view: 'review', icon: '🧠', label: 'Review' },
  { view: 'arena', icon: '⚔️', label: 'Arena' },
  { view: 'toolbox', icon: '🧰', label: 'Toolbox' },
  { view: 'trophies', icon: '🏆', label: 'Trophies' },
  { view: 'settings', icon: '⚙️', label: 'Settings' }
]

function Logo(): JSX.Element {
  return (
    <svg width="28" height="28" viewBox="0 0 100 100" aria-hidden>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6c8cff" />
          <stop offset="1" stopColor="#a064ff" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#lg)" />
      <g stroke="#fff" strokeWidth="7" strokeLinecap="round">
        <line x1="50" y1="30" x2="29" y2="68" />
        <line x1="50" y1="30" x2="71" y2="68" />
        <line x1="29" y1="68" x2="71" y2="68" />
      </g>
      <g fill="#fff">
        <circle cx="50" cy="30" r="10" />
        <circle cx="29" cy="68" r="10" />
        <circle cx="71" cy="68" r="10" />
      </g>
    </svg>
  )
}

function Sidebar(): JSX.Element {
  const view = useStore((st) => st.view)
  const go = useStore((st) => st.go)
  const due = useStore((st) => dueIds(st.s.srs, dateStr()).length)
  const active = view === 'lesson' ? 'path' : view === 'daily' ? 'home' : view
  return (
    <nav className="sidebar">
      <div className="brand">
        <Logo />
        <span>Blueprint</span>
      </div>
      {NAV.map((n) => (
        <button key={n.view} className={`nav-item ${active === n.view ? 'active' : ''}`} onClick={() => go(n.view)}>
          <span className="nav-icon">{n.icon}</span>
          {n.label}
          {n.view === 'review' && due > 0 && <span className="badge">{due}</span>}
        </button>
      ))}
      <div className="sidebar-foot muted small">System design, one day at a time.</div>
    </nav>
  )
}

function TopBar(): JSX.Element {
  const s = useStore((st) => st.s)
  const go = useStore((st) => st.go)
  const day = s.days[dateStr()]
  const lvl = levelInfo(s.xp)
  const lit = !!day?.goalMet
  return (
    <header className="topbar">
      <button className={`stat streak ${lit ? 'lit' : ''}`} title={lit ? 'Goal met today' : 'Hit your daily goal to extend the streak'} onClick={() => go('home')}>
        <span className="flame">🔥</span>
        <b>{s.streak.count}</b>
      </button>
      <div className="stat" title="Streak freezes protect a missed day automatically">
        ❄️ <b>{s.streak.freezes}</b>
      </div>
      <div className="stat goal" title="Today's XP vs daily goal">
        🎯
        <div className="goal-mini">
          <Bar value={day?.xp ?? 0} max={s.settings.dailyGoal} tone={lit ? 'good' : 'fire'} />
          <span className="small">
            {day?.xp ?? 0}/{s.settings.dailyGoal}
          </span>
        </div>
      </div>
      <div className="spacer" />
      <div className="level">
        <div className="level-badge">Lv {lvl.level}</div>
        <div className="level-info">
          <div className="small">
            <b>{lvl.title}</b> · {s.xp} XP
          </div>
          <Bar value={lvl.into} max={lvl.need} />
        </div>
        <XpPops />
      </div>
    </header>
  )
}

function CurrentView(): JSX.Element {
  const view = useStore((st) => st.view)
  switch (view) {
    case 'home':
      return <Home />
    case 'path':
      return <Path />
    case 'lesson':
      return <LessonPlayer />
    case 'review':
      return <Review />
    case 'arena':
      return <Arena />
    case 'daily':
      return <DailyIncident />
    case 'toolbox':
      return <Toolbox />
    case 'trophies':
      return <Trophies />
    case 'settings':
      return <Settings />
  }
}

export default function App(): JSX.Element {
  const ready = useStore((st) => st.ready)
  const view = useStore((st) => st.view)
  const params = useStore((st) => st.params)

  useEffect(() => {
    void useStore.getState().init()
    const timer = setInterval(() => useStore.getState().tick(), 30_000)
    const onFocus = (): void => useStore.getState().tick()
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  useEffect(() => {
    document.querySelector('.content')?.scrollTo(0, 0)
  }, [view, params])

  if (!ready) return <div className="boot">Loading…</div>

  return (
    <div className="shell">
      <Sidebar />
      <div className="main-col">
        <TopBar />
        <main className="content">
          <div className="content-inner" key={`${view}:${params.id ?? ''}`}>
            <CurrentView />
          </div>
        </main>
      </div>
      <Toasts />
      <Confetti />
    </div>
  )
}
