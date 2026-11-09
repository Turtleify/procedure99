import { useEffect, useState } from 'react'
import type { AppInfo, StartupMode } from '../../../shared/types'
import { api, useStore } from '../store'

const MODES: { id: StartupMode; title: string; desc: string }[] = [
  { id: 'tray', title: '🔔 Tray + reminders', desc: 'Starts quietly in the system tray when you log in, greets you with your streak, and sends a reminder at your chosen time.' },
  { id: 'window', title: '🪟 Open window at login', desc: 'The app window pops up every time you log in, plus the same reminders. Hardest to ignore.' },
  { id: 'running', title: '⏰ Reminders only', desc: 'Doesn’t launch at login. Reminders fire only while the app is running (e.g. in the tray).' },
  { id: 'off', title: '🔕 Off', desc: 'No launch at login, no notifications.' }
]

const GOALS = [
  { xp: 20, label: 'Casual', desc: '~5 min/day' },
  { xp: 30, label: 'Regular', desc: '~10 min/day' },
  { xp: 50, label: 'Serious', desc: '~15 min/day' },
  { xp: 80, label: 'Intense', desc: '~25 min/day' }
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
      <h1>Settings</h1>

      <section className="card">
        <h2>Daily goal</h2>
        <p className="muted small">Hit it every day to grow your streak.</p>
        <div className="choice-grid four">
          {GOALS.map((g) => (
            <button key={g.xp} className={`choice ${settings.dailyGoal === g.xp ? 'on' : ''}`} onClick={() => update({ dailyGoal: g.xp })}>
              <b>{g.label}</b>
              <span>{g.xp} XP</span>
              <span className="muted small">{g.desc}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Startup & reminders</h2>
        <p className="muted small">How hard should Blueprint work to get you back every day?</p>
        <div className="choice-grid two">
          {MODES.map((m) => (
            <button key={m.id} className={`choice left ${settings.startupMode === m.id ? 'on' : ''}`} onClick={() => update({ startupMode: m.id })}>
              <b>{m.title}</b>
              <span className="muted small">{m.desc}</span>
            </button>
          ))}
        </div>
        {info && (
          <p className="muted small">
            Launch at login is currently <b>{info.openAtLogin ? 'ON' : 'OFF'}</b>
            {!info.isPackaged && ' (dev build: install with "npm run dist" for a stable login entry)'}.
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
              <b>"Streak in danger" alert</b>
              <div className="muted small">A last-call notification late in the evening (after 9pm) when your streak is about to break.</div>
            </div>
            <input type="checkbox" className="switch" checked={settings.dangerAlert} disabled={!remindersOn} onChange={(e) => update({ dangerAlert: e.target.checked })} />
          </label>
          <div className="setting-row">
            <div>
              <b>Test notification</b>
              <div className="muted small">Check Windows is letting Blueprint notify you (Focus Assist can block it).</div>
            </div>
            <button
              className="btn"
              onClick={() => {
                void api.testNotification()
                setTested(true)
              }}
            >
              {tested ? 'Sent ✓' : 'Send test'}
            </button>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Window</h2>
        <label className="setting-row">
          <div>
            <b>Close to tray</b>
            <div className="muted small">Closing the window keeps Blueprint running in the tray so reminders still work. Quit from the tray menu.</div>
          </div>
          <input type="checkbox" className="switch" checked={settings.closeToTray} onChange={(e) => update({ closeToTray: e.target.checked })} />
        </label>
      </section>

      <section className="card danger-zone">
        <h2>Reset progress</h2>
        <p className="muted small">Wipes XP, streaks, lessons, reviews and trophies. Settings are kept. Type RESET to confirm.</p>
        <div className="row">
          <input className="text-input" value={confirmReset} onChange={(e) => setConfirmReset(e.target.value)} placeholder="RESET" />
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

      {info && <p className="muted small center">Blueprint v{info.version}</p>}
    </div>
  )
}
