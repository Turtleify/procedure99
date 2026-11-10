/**
 * Background music: shuffled playlist, looping forever.
 * Tracks are from Free To Use (https://freetouse.com/music); credits in README.md.
 * To add a track, drop the .mp3 in blueprint-background-music/ (project root), add it
 * here, and add its credit to the README.
 */

export interface Track {
  title: string
  artist: string
  src: string
}

export const TRACKS: Track[] = [
  { title: 'Moving Mountains', artist: 'Aeris', src: new URL('../../../../blueprint-background-music/Aeris - Moving Mountains (freetouse.com).mp3', import.meta.url).href },
  { title: 'Pure Dream', artist: 'Aeris', src: new URL('../../../../blueprint-background-music/Aeris - Pure Dream (freetouse.com).mp3', import.meta.url).href },
  { title: 'Yellow Flower', artist: 'Aeris', src: new URL('../../../../blueprint-background-music/Aeris - Yellow Flower (freetouse.com).mp3', import.meta.url).href },
  { title: 'Fresh Start', artist: 'Chill Pulse', src: new URL('../../../../blueprint-background-music/Chill Pulse - Fresh Start (freetouse.com).mp3', import.meta.url).href },
  { title: 'A Sweet Story', artist: 'Guillermo Guareschi', src: new URL('../../../../blueprint-background-music/Guillermo Guareschi - A Sweet Story (freetouse.com).mp3', import.meta.url).href },
  { title: 'Loving', artist: 'Pufino', src: new URL('../../../../blueprint-background-music/Pufino - Loving (freetouse.com).mp3', import.meta.url).href }
]

/** Default level: 30% of the files' own loudness. */
export const DEFAULT_MUSIC_VOLUME = 0.3

const FADE_MS = 1500

let audio: HTMLAudioElement | null = null
let order: number[] = []
let pos = 0
let volume = DEFAULT_MUSIC_VOLUME
let muted = false
let windowVisible = true
let fadeTimer: ReturnType<typeof setInterval> | undefined
let failures = 0
const listeners = new Set<(t: Track) => void>()

function shuffled(): number[] {
  const a = TRACKS.map((_, i) => i)
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function current(): Track {
  return TRACKS[order[pos]]
}

function load(): void {
  if (!audio) return
  audio.src = current().src
  listeners.forEach((cb) => cb(current()))
}

function next(): void {
  pos++
  if (pos >= order.length) {
    const last = order[order.length - 1]
    order = shuffled()
    // don't repeat the same song back-to-back across reshuffles
    if (order[0] === last && order.length > 1) [order[0], order[1]] = [order[1], order[0]]
    pos = 0
  }
  load()
  sync()
}

/** Play/pause to match mute + window visibility, fading in on start. */
function sync(): void {
  if (!audio) return
  const shouldPlay = !muted && volume > 0 && windowVisible
  clearInterval(fadeTimer)
  if (!shouldPlay) {
    audio.pause()
    return
  }
  if (!audio.paused) {
    audio.volume = volume
    return
  }
  audio.volume = 0
  audio.play().catch(() => undefined)
  const started = performance.now()
  fadeTimer = setInterval(() => {
    if (!audio) return
    const k = Math.min(1, (performance.now() - started) / FADE_MS)
    audio.volume = volume * k
    if (k >= 1) clearInterval(fadeTimer)
  }, 50)
}

export function initMusic(opts: { volume: number; muted: boolean }): void {
  if (audio || TRACKS.length === 0) return
  volume = opts.volume
  muted = opts.muted
  order = shuffled()
  pos = 0
  audio = new Audio()
  audio.preload = 'auto'
  audio.addEventListener('ended', next)
  audio.addEventListener('playing', () => (failures = 0))
  audio.addEventListener('error', () => {
    // skip a broken file rather than going silent, but give up if they all fail
    if (++failures < TRACKS.length) next()
  })
  load()
  sync()
}

export function setMusicVolume(v: number): void {
  volume = Math.max(0, Math.min(1, v))
  sync()
}

export function setMusicMuted(m: boolean): void {
  muted = m
  sync()
}

/** Pause while the window is hidden in the tray; resume when it's shown. */
export function setWindowVisible(v: boolean): void {
  windowVisible = v
  sync()
}

export function nowPlaying(): Track | null {
  return audio ? current() : null
}

export function onTrackChange(cb: (t: Track) => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}
