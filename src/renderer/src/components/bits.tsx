import { useEffect, useState, type ReactNode } from 'react'

/** Renders trusted, app-authored HTML from the content files. */
export function Html({ html, className }: { html: string; className?: string }): JSX.Element {
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
}

export function ProgressRing({ value, max, size = 120, stroke = 10, children }: { value: number; max: number; size?: number; stroke?: number; children?: ReactNode }): JSX.Element {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(1, max ? value / max : 0))
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} className="ring-track" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className={`ring-fill ${pct >= 1 ? 'done' : ''}`}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  )
}

export function Bar({ value, max, tone }: { value: number; max: number; tone?: string }): JSX.Element {
  const pct = Math.max(0, Math.min(100, max ? (value / max) * 100 : 0))
  return (
    <div className={`bar ${tone ?? ''}`}>
      <div className="bar-fill" style={{ width: `${pct}%` }} />
    </div>
  )
}

export function CodeBlock({ code }: { code: string }): JSX.Element {
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1200)
    return () => clearTimeout(t)
  }, [copied])
  return (
    <div className="code">
      <button
        className="code-copy"
        onClick={() => {
          void navigator.clipboard.writeText(code).then(() => setCopied(true))
        }}
      >
        {copied ? 'Copied ✓' : 'Copy'}
      </button>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  )
}

export function Modal({ onClose, children }: { onClose(): void; children: ReactNode }): JSX.Element {
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        {children}
      </div>
    </div>
  )
}
