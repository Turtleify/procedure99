import { useEffect } from 'react'
import { dateStr } from '../../shared/dates'
import { Bar } from './components/bits'
import { Icon } from './components/Icon'
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
  { view: 'home', icon: 'house', label: 'Today' },
  { view: 'path', icon: 'map', label: 'Path' },
  { view: 'review', icon: 'brain', label: 'Review' },
  { view: 'arena', icon: 'swords', label: 'Arena' },
  { view: 'toolbox', icon: 'wrench', label: 'Toolbox' },
  { view: 'trophies', icon: 'trophy', label: 'Trophies' },
  { view: 'settings', icon: 'settings', label: 'Settings' }
]

/** Drafting mark: a framed isometric block with registration ticks. */
function Logo(): JSX.Element {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden>
      <rect x="0.5" y="0.5" width="33" height="33" rx="3" stroke="#2a3f5e" />
      <path d="M17 7 L26 12 L26 22 L17 27 L8 22 L8 12 Z" stroke="#ece6d8" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M8 12 L17 17 L26 12 M17 17 V27" stroke="#ece6d8" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M17 17 L26 12 L26 22 L17 27 Z" fill="#6ec3db" fillOpacity="0.85" />
      <path d="M3 6 V3 H6 M28 3 H31 V6 M31 28 V31 H28 M6 31 H3 V28" stroke="#6ec3db" strokeWidth="1" />
    </svg>
  )
}

function Sidebar(): JSX.Element {
  const view = useStore((st) => st.view)
  const go = useStore((st) => st.go)
  const due = useStore((st) => dueIds(st.s.srs, dateStr()).length)
  const active = view === 'lesson' ? 'path' : view === 'daily' ? 'home' : view
  return (
    <nav className="sidebar" aria-label="Main">
      <div className="brand">
        <Logo />
        <div>
          <div className="brand-name">Blueprint</div>
          <div className="brand-sub">SYSTEM DESIGN</div>
        </div>
      </div>
      {NAV.map((n) => (
        <button key={n.view} className={`nav-item ${active === n.view ? 'active' : ''}`} onClick={() => go(n.view)} aria-current={active === n.view ? 'page' : undefined}>
          <Icon name={n.icon} size={17} />
          {n.label}
          {n.view === 'review' && due > 0 && (
            <span className="badge" aria-label={`${due} due`}>
              {due}
            </span>
          )}
        </button>
      ))}
      <div className="sidebar-foot">
        Sheet 01 of ∞<br />
        One drawing a day
      </div>
    </nav>
  )
}

function TopBar(): JSX.Element {
  const s = useStore((st) => st.s)
  const go = useStore((st) => st.go)
  const day = s.days[dateStr()]
  const lvl = levelInfo(s.xp)
  const lit = !!day?.goalMet
  const pad = (n: number): string => String(n).padStart(2, '0')
  return (
    <header className="topbar">
      <button className={`readout ${lit ? 'lit' : ''}`} onClick={() => go('home')} title={lit ? 'Goal met today' : 'Hit your daily goal to extend the streak'}>
        <span className="readout-icon">
          <Icon name="flame" size={20} />
        </span>
        <div>
          <div className="readout-k">Streak</div>
          <div className="readout-v">{pad(s.streak.count)} days</div>
        </div>
      </button>
      <div className="readout" title="Streak freezes protect a missed day automatically">
        <span className="readout-icon">
          <Icon name="snowflake" size={18} />
        </span>
        <div>
          <div className="readout-k">Freezes</div>
          <div className="readout-v">{pad(s.streak.freezes)}</div>
        </div>
      </div>
      <div className="readout" title="Today's XP vs daily goal">
        <div>
          <div className="readout-k">Today</div>
          <div className="readout-v">
            {day?.xp ?? 0}
            <span className="muted"> / {s.settings.dailyGoal} XP</span>
          </div>
          <Bar value={day?.xp ?? 0} max={s.settings.dailyGoal} tone={lit ? 'good' : 'fire'} />
        </div>
      </div>
      <div className="spacer" />
      <div className="level">
        <div>
          <div className="readout-k">Level</div>
          <div className="level-num">{lvl.level}</div>
        </div>
        <div className="level-info">
          <div className="level-title">
            {lvl.title}
            <span>{s.xp} XP</span>
          </div>
          <Bar value={lvl.into} max={lvl.need} tone="paper" />
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

  if (!ready) return <div className="boot">LOADING SHEET…</div>

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
