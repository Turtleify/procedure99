import { useEffect, useRef } from 'react'
import { useStore, type Toast } from '../store'

function ToastItem({ t }: { t: Toast }): JSX.Element {
  const dismiss = useStore((s) => s.dismissToast)
  useEffect(() => {
    const timer = setTimeout(() => dismiss(t.id), 4500)
    return () => clearTimeout(timer)
  }, [t.id, dismiss])
  return (
    <div className={`toast ${t.tone ?? ''}`} onClick={() => dismiss(t.id)}>
      <div className="toast-icon">{t.icon}</div>
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

const COLORS = ['#6c8cff', '#a06cff', '#3ddc97', '#ffd166', '#ff8a3d', '#5cc8ff', '#f06292']

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
    const parts = Array.from({ length: 140 }, () => ({
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
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6)
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
