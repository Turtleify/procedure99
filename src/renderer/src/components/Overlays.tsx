import { useEffect, useRef, useState } from 'react'
import { sfx } from '../lib/sound'
import { useStore, type Toast } from '../store'
import { Icon } from './Icon'

function ToastItem({ t }: { t: Toast }): JSX.Element {
  const dismiss = useStore((s) => s.dismissToast)
  useEffect(() => {
    const timer = setTimeout(() => dismiss(t.id), 4500)
    return () => clearTimeout(timer)
  }, [t.id, dismiss])
  return (
    <div className={`toast ${t.tone ?? ''}`} onClick={() => dismiss(t.id)}>
      <div className="toast-icon">
        <Icon name={t.icon} size={20} />
      </div>
      <div>
        <div className="toast-title">{t.title}</div>
        {t.body && <div className="toast-body">{t.body}</div>}
      </div>
    </div>
  )
}

export function Toasts(): JSX.Element {
  const toasts = useStore((s) => s.toasts)
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <ToastItem key={t.id} t={t} />
      ))}
    </div>
  )
}

function Pop({ id, n }: { id: number; n: number }): JSX.Element {
  const clear = useStore((s) => s.clearPop)
  useEffect(() => {
    const timer = setTimeout(() => clear(id), 2000) // starts after the flying XP lands (see .xp-pop delay)
    return () => clearTimeout(timer)
  }, [id, clear])
  return <div className="xp-pop">+{n} XP</div>
}

export function XpPops(): JSX.Element {
  const pops = useStore((s) => s.xpPops)
  return (
    <div className="xp-pops">
      {pops.map((p) => (
        <Pop key={p.id} id={p.id} n={p.n} />
      ))}
    </div>
  )
}

// ───────── XP flying into the level bar ─────────

/** Where the user last clicked, so XP can fly from the thing that earned it. */
let lastPointer: { x: number; y: number; t: number } | null = null
if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', (e) => (lastPointer = { x: e.clientX, y: e.clientY, t: performance.now() }), true)
}

const reducedMotion = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches

function origin(): { x: number; y: number } {
  if (lastPointer && performance.now() - lastPointer.t < 2500) return lastPointer
  // keyboard answers etc.: start from the middle of the page
  const r = document.querySelector('.content')?.getBoundingClientRect()
  return r ? { x: r.left + r.width / 2, y: r.top + r.height * 0.45 } : { x: innerWidth / 2, y: innerHeight / 2 }
}

/** The visible part of the level box to aim at (the bar, or the number when the bar is hidden). */
function target(): { x: number; y: number } | null {
  for (const sel of ['.level-info .bar', '.level-num']) {
    const r = document.querySelector(sel)?.getBoundingClientRect()
    if (r && r.width > 0) return { x: r.left + r.width * 0.6, y: r.top + r.height / 2 }
  }
  return null
}

/** Points along a quadratic curve that arcs upward between a and b. */
function curve(a: { x: number; y: number }, b: { x: number; y: number }, lift: number, steps = 14): { x: number; y: number }[] {
  const c = { x: (a.x + b.x) / 2 + (Math.random() - 0.5) * 120, y: Math.min(a.y, b.y) - lift }
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps
    const u = 1 - t
    return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y }
  })
}

const ORBS = 7

function Flight({ n, from, to, onDone }: { n: number; from: { x: number; y: number }; to: { x: number; y: number }; onDone: () => void }): JSX.Element {
  const chip = useRef<HTMLDivElement>(null)
  const orbs = useRef<(HTMLSpanElement | null)[]>([])

  useEffect(() => {
    const anims: Animation[] = []
    const fly = (el: HTMLElement, start: { x: number; y: number }, delay: number, duration: number, endScale: number, lift: number): Animation => {
      const pts = curve(start, to, lift)
      const frames = pts.map((p, i) => ({
        transform: `translate(${p.x}px, ${p.y}px) translate(-50%, -50%) scale(${1 - (1 - endScale) * (i / (pts.length - 1)) ** 2})`,
        opacity: i === pts.length - 1 ? 0.3 : 1
      }))
      const a = el.animate(frames, { duration, delay, easing: 'cubic-bezier(0.55, 0, 0.75, 0.2)', fill: 'both' })
      anims.push(a)
      return a
    }
    // the chip pops up where XP was earned, then flies
    if (chip.current) {
      const up = { x: from.x, y: from.y - 34 }
      const pop = chip.current.animate(
        [
          { transform: `translate(${from.x}px, ${from.y}px) translate(-50%, -50%) scale(0.6)`, opacity: 0 },
          { transform: `translate(${up.x}px, ${up.y}px) translate(-50%, -50%) scale(1.05)`, opacity: 1 }
        ],
        { duration: 220, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', fill: 'forwards' }
      )
      anims.push(pop)
      fly(chip.current, up, 260, 640, 0.35, 70)
    }
    let landed = false
    orbs.current.forEach((el, i) => {
      if (!el) return
      const start = { x: from.x + (Math.random() - 0.5) * 50, y: from.y + (Math.random() - 0.5) * 30 }
      const a = fly(el, start, 120 + i * 45, 560 + Math.random() * 220, 0.5, 40 + Math.random() * 90)
      a.finished
        .then(() => {
          if (landed) return
          landed = true
          sfx.xpLand()
          const lvl = document.querySelector('.level')
          lvl?.classList.remove('bump')
          void (lvl as HTMLElement | null)?.offsetWidth // restart the animation
          lvl?.classList.add('bump')
        })
        .catch(() => undefined)
    })
    void Promise.allSettled(anims.map((a) => a.finished)).then(onDone)
    return () => anims.forEach((a) => a.cancel())
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div ref={chip} className="xp-fly-chip">
        +{n} XP
      </div>
      {Array.from({ length: ORBS }, (_, i) => (
        <span key={i} ref={(el) => (orbs.current[i] = el)} className="xp-fly-orb" />
      ))}
    </>
  )
}

/** Whenever XP is gained, a "+N XP" chip and a few sparks fly from where you clicked into the level bar. */
export function FlyingXp(): JSX.Element {
  const pops = useStore((s) => s.xpPops)
  const seen = useRef(new Set<number>())
  const [flights, setFlights] = useState<{ id: number; n: number; from: { x: number; y: number }; to: { x: number; y: number } }[]>([])

  useEffect(() => {
    const fresh = pops.filter((p) => !seen.current.has(p.id))
    if (!fresh.length) return
    fresh.forEach((p) => seen.current.add(p.id))
    if (reducedMotion()) return
    const to = target()
    if (!to) return
    const from = origin()
    setFlights((f) => [...f, ...fresh.map((p) => ({ id: p.id, n: p.n, from, to }))].slice(-4))
  }, [pops])

  return (
    <div className="xp-fly" aria-hidden>
      {flights.map((f) => (
        <Flight key={f.id} n={f.n} from={f.from} to={f.to} onDone={() => setFlights((all) => all.filter((x) => x.id !== f.id))} />
      ))}
    </div>
  )
}

// paper snips in the house palette — restrained, not a rainbow
const COLORS = ['#1f2328', '#7ab814', '#1a6f8c', '#d4a017']

export function Confetti(): JSX.Element {
  const burst = useStore((s) => s.confetti)
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!burst || !ref.current) return
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const parts = Array.from({ length: 80 }, () => ({
      x: canvas.width / 2 + (Math.random() - 0.5) * 200,
      y: canvas.height / 3,
      vx: (Math.random() - 0.5) * 14,
      vy: -Math.random() * 12 - 4,
      r: Math.random() * 6 + 3,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      c: COLORS[Math.floor(Math.random() * COLORS.length)]
    }))
    let frame = 0
    let raf = 0
    const draw = (): void => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of parts) {
        p.vy += 0.35
        p.x += p.vx
        p.y += p.vy
        p.rot += p.vr
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.fillStyle = p.c
        ctx.globalAlpha = Math.max(0, 1 - frame / 150)
        ctx.fillRect(-p.r / 2, -1, p.r * 1.4, 2.5)
        ctx.restore()
      }
      if (++frame < 150) raf = requestAnimationFrame(draw)
      else ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [burst])

  return <canvas ref={ref} className="confetti" />
}
