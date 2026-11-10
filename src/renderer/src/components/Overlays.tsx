import { useEffect, useRef } from 'react'
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
    const timer = setTimeout(() => clear(id), 1200)
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
