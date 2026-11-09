import { useEffect, useState, type ReactNode } from 'react'
import { Icon } from './Icon'

/** Renders trusted, app-authored HTML from the content files. */
export function Html({ html, className }: { html: string; className?: string }): JSX.Element {
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
}

/** Mono uppercase section label with optional index number and trailing hairline. */
export function Label({ n, children, bare }: { n?: string; children: ReactNode; bare?: boolean }): JSX.Element {
  return (
    <div className={`label ${bare ? 'bare' : ''}`}>
      {n && <span className="num">{n}</span>}
      <span>{children}</span>
    </div>
  )
}

/** Gauge made of tick marks rather than a smooth arc — reads like an instrument dial. */
export function ProgressRing({ value, max, size = 168, ticks = 40, children }: { value: number; max: number; size?: number; ticks?: number; children?: ReactNode }): JSX.Element {
  const pct = Math.max(0, Math.min(1, max ? value / max : 0))
  const lit = Math.round(pct * ticks)
  const c = size / 2
  const rOuter = size / 2 - 2
  const rInner = rOuter - 12
  return (
    <div className="ring" style={{ width: size, height: size }} role="img" aria-label={`${value} of ${max}`}>
      <svg width={size} height={size}>
        {Array.from({ length: ticks }, (_, i) => {
          const a = (i / ticks) * Math.PI * 2 - Math.PI / 2
          const major = i % 5 === 0
          const r1 = major ? rInner - 4 : rInner
          return (
            <line
              key={i}
              x1={c + Math.cos(a) * r1}
              y1={c + Math.sin(a) * r1}
              x2={c + Math.cos(a) * rOuter}
              y2={c + Math.sin(a) * rOuter}
              className={`ring-tick ${i < lit ? 'on' : ''} ${pct >= 1 ? 'done' : ''}`}
              strokeWidth={major ? 2 : 1.5}
            />
          )
        })}
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
      <button className="code-copy" onClick={() => void navigator.clipboard.writeText(code).then(() => setCopied(true))}>
        <Icon name={copied ? 'check' : 'copy'} size={12} />
        {copied ? 'Copied' : 'Copy'}
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
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <Icon name="x" />
        </button>
        {children}
      </div>
    </div>
  )
}
