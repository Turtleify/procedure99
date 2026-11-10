import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  Notification,
  powerMonitor,
  shell,
  Tray,
  type MenuItemConstructorOptions
} from 'electron'
import { join, resolve } from 'path'
import { readFileSync, renameSync, writeFileSync } from 'fs'
import type { AppState, StartupMode, WindowAction } from '../shared/types'
import { makeIcon } from './icon'
import { decideReminder, reminderText, summarize, type ReminderSent } from './reminders'

const APP_ID = 'com.blueprint.systemdesign'
const START_HIDDEN = process.argv.includes('--hidden')
const DEV_URL = process.env['ELECTRON_RENDERER_URL']

let win: BrowserWindow | null = null
let tray: Tray | null = null
let state: AppState | null = null
let quitting = false
let pendingView: string | null = null
const liveNotifications = new Set<Notification>()

// ---------- persistence ----------

const statePath = (): string => join(app.getPath('userData'), 'progress.json')
const remindersPath = (): string => join(app.getPath('userData'), 'reminders.json')

function readJSON<T>(p: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(p, 'utf8')) as T
  } catch {
    return fallback
  }
}

function writeJSON(p: string, data: unknown): void {
  const tmp = `${p}.tmp`
  writeFileSync(tmp, JSON.stringify(data, null, 2))
  renameSync(tmp, p)
}

// ---------- startup mode / login item ----------

function applyStartupMode(mode: StartupMode): void {
  if (process.env['BLUEPRINT_NO_LOGIN_ITEM']) return // test runs shouldn't touch the OS login items
  const openAtLogin = mode === 'tray' || mode === 'window'
  const args = mode === 'tray' ? ['--hidden'] : []
  // In dev the executable is electron.exe, so it needs the app path as its first argument.
  const fullArgs = process.defaultApp ? [resolve(process.argv[1] ?? '.'), ...args] : args
  app.setLoginItemSettings({ openAtLogin, path: process.execPath, args: fullArgs, name: 'Blueprint' })
}

// ---------- window ----------

function createWindow(): void {
  win = new BrowserWindow({
    width: 1240,
    height: 820,
    minWidth: 980,
    minHeight: 660,
    show: false,
    title: 'Blueprint',
    backgroundColor: '#f7f5ef',
    icon: makeIcon(256),
    frame: false, // custom title bar drawn by the renderer
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      autoplayPolicy: 'no-user-gesture-required' // background music starts on its own
    }
  })

  win.on('maximize', () => win?.webContents.send('win:maximized', true))
  win.on('unmaximize', () => win?.webContents.send('win:maximized', false))
  win.on('show', () => win?.webContents.send('win:visible', true))
  win.on('hide', () => win?.webContents.send('win:visible', false))

  win.once('ready-to-show', () => {
    if (!START_HIDDEN) win?.show()
  })

  win.webContents.on('did-finish-load', () => {
    if (pendingView) {
      win?.webContents.send('navigate', pendingView)
      pendingView = null
    }
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) void shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env['BLUEPRINT_DEBUG']) {
    win.webContents.on('console-message', (_e, level, message, line, source) => {
      console.log(`[renderer:${level}] ${message} (${source}:${line})`)
    })
  }

  win.on('close', (e) => {
    if (!quitting && (state?.settings.closeToTray ?? true)) {
      e.preventDefault()
      win?.hide()
    }
  })

  if (DEV_URL) void win.loadURL(DEV_URL)
  else void win.loadFile(join(__dirname, '../renderer/index.html'))
}

function showWindow(view?: string): void {
  if (!win) return
  if (view) {
    if (win.webContents.isLoading()) pendingView = view
    else win.webContents.send('navigate', view)
  }
  if (win.isMinimized()) win.restore()
  win.show()
  win.focus()
}

// ---------- notifications ----------

function notify(title: string, body: string, view = 'home'): void {
  if (!Notification.isSupported()) return
  const n = new Notification({ title, body, icon: makeIcon(64) })
  liveNotifications.add(n)
  n.on('click', () => showWindow(view))
  n.on('close', () => liveNotifications.delete(n))
  n.show()
  setTimeout(() => liveNotifications.delete(n), 10 * 60_000)
}

function checkReminders(): void {
  if (win?.isVisible() && win.isFocused()) return
  const sent = readJSON<ReminderSent>(remindersPath(), {})
  const kind = decideReminder(state, sent)
  if (!kind) return
  const sum = summarize(state)
  const { title, body } = reminderText(kind, sum)
  notify(title, body, kind === 'danger' || sum.due === 0 ? 'home' : 'review')
  sent[kind] = sum.today
  writeJSON(remindersPath(), sent)
}

function loginGreeting(): void {
  if (!state || state.settings.startupMode === 'off') return
  const sum = summarize(state)
  const sent = readJSON<ReminderSent>(remindersPath(), {})
  if (sum.goalMet || sent.login === sum.today) return
  const streakLine = sum.streak > 0 ? `🔥 ${sum.streak}-day streak.` : 'Start a streak today.'
  const dueLine = sum.due > 0 ? ` ${sum.due} review card${sum.due === 1 ? '' : 's'} waiting.` : ''
  notify('Blueprint is ready', `${streakLine}${dueLine} About 5 minutes keeps it alive.`)
  sent.login = sum.today
  writeJSON(remindersPath(), sent)
}

// ---------- tray ----------

function updateTray(): void {
  if (!tray) return
  const sum = summarize(state)
  const mode = state?.settings.startupMode ?? 'tray'
  tray.setToolTip(`Blueprint · 🔥 ${sum.streak}-day streak · ${sum.xpToday}/${sum.goal} XP today`)
  tray.setImage(sum.goalMet ? makeIcon(32, [40, 120, 90]) : makeIcon(32))

  const modeItem = (m: StartupMode, label: string): MenuItemConstructorOptions => ({
    label,
    type: 'radio',
    checked: mode === m,
    click: () => {
      if (state) state.settings.startupMode = m
      applyStartupMode(m)
      // keep the renderer's copy of settings in sync so its next save doesn't revert this
      win?.webContents.send('navigate', `mode:${m}`)
      updateTray()
    }
  })

  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Open Blueprint', click: () => showWindow('home') },
      { type: 'separator' },
      { label: `🔥 Streak: ${sum.streak} day${sum.streak === 1 ? '' : 's'}`, enabled: false },
      { label: `${sum.goalMet ? '✅' : '🎯'} Today: ${sum.xpToday}/${sum.goal} XP`, enabled: false },
      { label: `🧠 Review (${sum.due} due)`, click: () => showWindow('review') },
      { type: 'separator' },
      {
        label: 'Startup & reminders',
        submenu: [
          modeItem('tray', 'Start in tray at login + reminders'),
          modeItem('window', 'Open window at login + reminders'),
          modeItem('running', 'Reminders only while running'),
          modeItem('off', 'Off')
        ]
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          quitting = true
          app.quit()
        }
      }
    ])
  )
}

// ---------- IPC ----------

function registerIpc(): void {
  ipcMain.handle('state:load', () => state)
  ipcMain.handle('state:save', (_e, next: AppState) => {
    state = next
    writeJSON(statePath(), next)
    updateTray()
  })
  ipcMain.handle('app:setStartupMode', (_e, mode: StartupMode) => {
    applyStartupMode(mode)
    if (state) state.settings.startupMode = mode
    updateTray()
  })
  ipcMain.handle('app:testNotification', () => {
    const sum = summarize(state)
    const { title, body } = reminderText('reminder', sum)
    notify(title, body)
  })
  ipcMain.on('win:control', (_e, action: WindowAction) => {
    if (!win) return
    if (action === 'minimize') win.minimize()
    else if (action === 'maximize') {
      if (win.isMaximized()) win.unmaximize()
      else win.maximize()
    } else if (action === 'close') win.close() // respects close-to-tray
  })
  ipcMain.handle('win:isMaximized', () => win?.isMaximized() ?? false)
  ipcMain.handle('win:isVisible', () => win?.isVisible() ?? false)
  ipcMain.handle('app:info', () => ({
    version: app.getVersion(),
    isPackaged: app.isPackaged,
    openAtLogin: app.getLoginItemSettings({ path: process.execPath }).openAtLogin
  }))
}

// ---------- smoke test: BLUEPRINT_SHOTS=<dir> captures each view to PNG, then quits ----------

async function captureViews(dir: string): Promise<void> {
  if (!win) return
  const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))
  await wait(1500)
  for (const view of ['home', 'path', 'review', 'daily', 'arena', 'toolbox', 'trophies', 'settings']) {
    win.webContents.send('navigate', view)
    await wait(700)
    const img = await win.webContents.capturePage()
    writeFileSync(join(dir, `${view}.png`), img.toPNG())
  }
  quitting = true
  app.quit()
}

// ---------- boot ----------

// Lets test runs use a throwaway profile instead of your real progress.
if (process.env['BLUEPRINT_USER_DATA']) app.setPath('userData', process.env['BLUEPRINT_USER_DATA'])

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => showWindow())
  app.setAppUserModelId(app.isPackaged ? APP_ID : process.execPath)

  app.whenReady().then(() => {
    state = readJSON<AppState | null>(statePath(), null)
    applyStartupMode(state?.settings.startupMode ?? 'tray')
    registerIpc()
    createWindow()

    tray = new Tray(makeIcon(32))
    tray.on('click', () => showWindow())
    updateTray()

    if (START_HIDDEN) loginGreeting()
    const shots = process.env['BLUEPRINT_SHOTS']
    if (shots) win?.webContents.once('did-finish-load', () => void captureViews(shots))
    setInterval(() => {
      checkReminders()
      updateTray()
    }, 60_000)
    powerMonitor.on('resume', checkReminders)
    powerMonitor.on('unlock-screen', checkReminders)
  })

  app.on('before-quit', () => {
    quitting = true
  })

  // Keep running in the tray when all windows are closed.
  app.on('window-all-closed', () => {
    /* intentionally empty */
  })
}
