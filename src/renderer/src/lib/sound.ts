/**
 * UI sound effects, synthesized with the Web Audio API (no audio files).
 *
 * To use a recorded sound instead, replace a function body with e.g.
 *   new Audio(new URL('../assets/click.mp3', import.meta.url).href).play()
 */

let ctx: AudioContext | null = null
let master: GainNode | null = null
const prefs = { enabled: true, hover: true, volume: 0.6 }

export function setSoundPrefs(p: Partial<typeof prefs>): void {
  Object.assign(prefs, p)
  if (master) master.gain.value = prefs.volume
}

function audio(): { ctx: AudioContext; out: GainNode } | null {
  if (!prefs.enabled) return null
  if (!ctx) {
    ctx = new AudioContext()
    master = ctx.createGain()
    master.gain.value = prefs.volume
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return { ctx, out: master! }
}

interface ToneOpts {
  freq: number
  /** glide to this frequency over the note */
  to?: number
  dur: number
  gain: number
  type?: OscillatorType
  /** start offset in seconds */
  at?: number
}

function tone({ freq, to, dur, gain, type = 'sine', at = 0 }: ToneOpts): void {
  const a = audio()
  if (!a) return
  const t0 = a.ctx.currentTime + at
  const osc = a.ctx.createOscillator()
  const env = a.ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur)
  // fast attack, exponential decay: soft, click-free
  env.gain.setValueAtTime(0.0001, t0)
  env.gain.exponentialRampToValueAtTime(gain, t0 + 0.006)
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(env).connect(a.out)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

let lastHover = 0

export const sfx = {
  /** barely-there tick when the pointer enters a button */
  hover(): void {
    if (!prefs.hover) return
    const now = performance.now()
    if (now - lastHover < 45) return // sweeping across a list shouldn't buzz
    lastHover = now
    tone({ freq: 2200, dur: 0.03, gain: 0.025 })
  },
  /** short, soft press */
  click(): void {
    tone({ freq: 620, to: 420, dur: 0.06, gain: 0.08, type: 'triangle' })
  },
  /** rising two-note chime */
  correct(): void {
    tone({ freq: 660, dur: 0.12, gain: 0.12, type: 'triangle' })
    tone({ freq: 990, dur: 0.22, gain: 0.12, type: 'triangle', at: 0.08 })
  },
  /** low, gentle "nope" — informative, not punishing */
  wrong(): void {
    tone({ freq: 220, to: 160, dur: 0.22, gain: 0.12, type: 'triangle' })
  },
  /** soft sparkle when gained XP lands in the level bar */
  xpLand(): void {
    tone({ freq: 1320, dur: 0.07, gain: 0.05, type: 'triangle' })
    tone({ freq: 1760, dur: 0.1, gain: 0.04, type: 'triangle', at: 0.05 })
  },
  /** arpeggio fanfare for level-ups */
  levelUp(): void {
    ;[523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, dur: 0.28, gain: 0.11, type: 'triangle', at: i * 0.09 }))
    tone({ freq: 1568, dur: 0.5, gain: 0.05, at: 0.36 })
  }
}

/** Elements that count as "buttons" for hover/click sounds. */
const TARGET = 'button:not(:disabled), .btn, [role="button"], [role="tab"]'
/** These play their own sound (or none) instead of the generic click. */
const OWN_SOUND = '.mcq-option, .win-btn'

/** One set of document-level listeners covers every button in the app. */
export function installUiSounds(): () => void {
  let hovered: Element | null = null
  const onOver = (e: PointerEvent): void => {
    const el = (e.target as Element | null)?.closest?.(TARGET) ?? null
    if (el && el !== hovered && !el.closest('.win-btn')) sfx.hover()
    hovered = el
  }
  const onClick = (e: MouseEvent): void => {
    const el = (e.target as Element | null)?.closest?.(TARGET)
    if (el && !el.closest(OWN_SOUND)) sfx.click()
  }
  document.addEventListener('pointerover', onOver)
  document.addEventListener('click', onClick, true)
  return () => {
    document.removeEventListener('pointerover', onOver)
    document.removeEventListener('click', onClick, true)
  }
}
