import { useEffect, useState } from 'react'
import type { AppInfo, StartupMode } from '../../../shared/types'
import { Label } from '../components/bits'
import { Icon } from '../components/Icon'
import { api, useStore } from '../store'

const MODES: { id: StartupMode; icon: string; title: string; desc: string }[] = [
  { id: 'tray', icon: 'bell', title: 'Tray + reminders', desc: 'Starts quietly in the system tray when you log in, greets you with your streak, and nudges you at your reminder time.' },
  { id: 'window', icon: 'monitor', title: 'Open window at login', desc: 'The window opens every time you log in, plus the same reminders. Hardest to ignore.' },
  { id: 'running', icon: 'play', title: 'Reminders only', desc: 'No launch at login. Reminders fire only while Blueprint is running, e.g. in the tray.' },
  { id: 'off', icon: 'bell-off', title: 'Off', desc: 'No launch at login and no notifications.' }
]

const GOALS = [
  { xp: 20, label: 'Casual', desc: '~5 min a day' },
  { xp: 30, label: 'Regular', desc: '~10 min a day' },
  { xp: 50, label: 'Serious', desc: '~15 min a day' },
  { xp: 80, label: 'Intense', desc: '~25 min a day' }
]

export function Settings(): JSX.Element {
  const settings = useStore((st) => st.s.settings)
  const update = useStore((st) => st.updateSettings)
  const reset = useStore((st) => st.reset)
  const [info, setInfo] = useState<AppInfo | null>(null)
  const [confirmReset, setConfirmReset] = useState('')
  const [tested, setTested] = useState(false)

  useEffect(() => {
    void api.getInfo().then(setInfo)
  }, [settings.startupMode])

  const remindersOn = settings.startupMode !== 'off'

  return (
    <div className="settings">
      <div className="page-head">
        <h1>
          <em>Settings</em>
        </h1>
      </div>

      <section className="card">
        <Label n="01">Daily goal</Label>
        <div className="choice-grid four">
          {GOALS.map((g) => (
            <button key={g.xp} className={`choice ${settings.dailyGoal === g.xp ? 'on' : ''}`} onClick={() => update({ dailyGoal: g.xp })} aria-pressed={settings.dailyGoal === g.xp}>
              <span className="hint-text">{g.label}</span>
              <span className="choice-big">{g.xp}</span>
              <span className="muted small">XP · {g.desc}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <Label n="02">Startup & reminders</Label>
        <p className="muted small">How hard should Blueprint work to get you back every day?</p>
        <div className="choice-grid two">
          {MODES.map((m) => (
            <button key={m.id} className={`choice ${settings.startupMode === m.id ? 'on' : ''}`} onClick={() => update({ startupMode: m.id })} aria-pressed={settings.startupMode === m.id}>
              <span className="choice-head">
                <Icon name={m.icon} size={16} />
                {m.title}
              </span>
              <span className="muted small">{m.desc}</span>
            </button>
          ))}
        </div>
        {info && (
          <p className="hint-text" style={{ marginTop: 14 }}>
            Launch at login: {info.openAtLogin ? 'on' : 'off'}
            {!info.isPackaged && ' · dev build — install with npm run dist for a stable entry'}
          </p>
        )}

        <div className={`setting-rows ${remindersOn ? '' : 'disabled'}`}>
          <label className="setting-row">
            <div>
              <b>Reminder time</b>
              <div className="muted small">If you haven’t hit your goal by then, you get a nudge.</div>
            </div>
            <input type="time" value={settings.reminderTime} disabled={!remindersOn} onChange={(e) => e.target.value && update({ reminderTime: e.target.value })} />
          </label>
          <label className="setting-row">
            <div>
              <b>Streak-in-danger alert</b>
              <div className="muted small">A last call late in the evening (after 9pm) when your streak is about to break.</div>
            </div>
            <input type="checkbox" className="switch" checked={settings.dangerAlert} disabled={!remindersOn} onChange={(e) => update({ dangerAlert: e.target.checked })} />
          </label>
          <div className="setting-row">
            <div>
              <b>Test notification</b>
              <div className="muted small">Check that Windows lets Blueprint notify you. Focus Assist can block it.</div>
            </div>
            <button
              className="btn"
              onClick={() => {
                void api.testNotification()
                setTested(true)
              }}
            >
              <Icon name={tested ? 'check' : 'bell'} size={15} />
              {tested ? 'Sent' : 'Send test'}
            </button>
          </div>
        </div>
      </section>

      <section className="card">
        <Label n="03">Window</Label>
        <label className="setting-row" style={{ borderTop: 'none', paddingTop: 0 }}>
          <div>
            <b>Close to tray</b>
            <div className="muted small">Closing the window keeps Blueprint in the tray so reminders still work. Quit from the tray menu.</div>
          </div>
          <input type="checkbox" className="switch" checked={settings.closeToTray} onChange={(e) => update({ closeToTray: e.target.checked })} />
        </label>
      </section>

      <section className="card danger-zone">
        <Label n="04">Reset progress</Label>
        <p className="muted small">Wipes XP, streaks, lessons, reviews and trophies. Settings are kept. Type RESET to confirm.</p>
        <div className="row">
          <input className="text-input" value={confirmReset} onChange={(e) => setConfirmReset(e.target.value)} placeholder="RESET" aria-label="Type RESET to confirm" />
          <button
            className="btn danger"
            disabled={confirmReset !== 'RESET'}
            onClick={() => {
              reset()
              setConfirmReset('')
            }}
          >
            Reset everything
          </button>
        </div>
      </section>

      {info && <p className="hint-text center">Blueprint v{info.version}</p>}
    </div>
  )
}
