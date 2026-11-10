import { Braces, Cog, Table2, Zap, type LucideIcon } from 'lucide-react'
import type { DiagramNode, ShapeKind } from '../../../shared/types'

/** Excalidraw-style pastel fill + darker stroke per shape family. */
export const SHAPE_COLORS: Record<ShapeKind, { fill: string; stroke: string }> = {
  client: { fill: '#e7f5ff', stroke: '#1864ab' },
  mobile: { fill: '#e7f5ff', stroke: '#1864ab' },
  dns: { fill: '#fff4e6', stroke: '#b35400' },
  cdn: { fill: '#e3fafc', stroke: '#0b7285' },
  lb: { fill: '#fff4e6', stroke: '#b35400' },
  gateway: { fill: '#fff4e6', stroke: '#b35400' },
  server: { fill: '#ebfbee', stroke: '#2b8a3e' },
  service: { fill: '#ebfbee', stroke: '#2b8a3e' },
  worker: { fill: '#f4fce3', stroke: '#5c940d' },
  cache: { fill: '#fff5f5', stroke: '#c92a2a' },
  sql: { fill: '#f3f0ff', stroke: '#5f3dc4' },
  nosql: { fill: '#e6fcf5', stroke: '#087f5b' },
  storage: { fill: '#fff9db', stroke: '#946800' },
  search: { fill: '#fff0f6', stroke: '#a61e4d' },
  queue: { fill: '#f8f0fc', stroke: '#862e9c' },
  rect: { fill: 'transparent', stroke: '#495057' },
  text: { fill: 'transparent', stroke: '#1f2328' }
}

const SW = 2 // stroke width

function Glyph({ icon: C, cx, cy, size, color }: { icon: LucideIcon; cx: number; cy: number; size: number; color: string }): JSX.Element {
  return <C x={cx - size / 2} y={cy - size / 2} width={size} height={size} color={color} strokeWidth={1.8} aria-hidden />
}

/** Two short strokes forming an open arrowhead at (x2, y2). */
function head(x1: number, y1: number, x2: number, y2: number, s = 6): string {
  const a = Math.atan2(y2 - y1, x2 - x1)
  const p = (da: number): string => `${x2 - s * Math.cos(a - da)},${y2 - s * Math.sin(a - da)}`
  return `M${p(0.5)} L${x2},${y2} L${p(-0.5)}`
}

function cylinder(w: number, h: number, ry: number): string {
  return `M0,${ry} L0,${h - ry} A${w / 2},${ry} 0 0 0 ${w},${h - ry} L${w},${ry}`
}

/** The shape itself, drawn in local coordinates (0,0)–(w,h). */
export function ShapeBody({ kind, w, h }: { kind: ShapeKind; w: number; h: number }): JSX.Element {
  const { fill, stroke } = SHAPE_COLORS[kind]
  const common = { fill, stroke, strokeWidth: SW, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const }
  const line = { fill: 'none', stroke, strokeWidth: SW, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  const cx = w / 2
  const cy = h / 2

  switch (kind) {
    case 'client':
      return (
        <g>
          <rect width={w} height={h} rx={7} {...common} />
          <line x1={0} y1={17} x2={w} y2={17} {...line} />
          {[11, 20, 29].map((x) => (
            <circle key={x} cx={x} cy={8.5} r={2.6} fill={stroke} />
          ))}
          <rect x={12} y={27} width={w * 0.38} height={h - 39} rx={3} {...line} strokeWidth={1.6} />
          {[0, 1, 2].map((i) => (
            <line key={i} x1={w * 0.38 + 22} y1={31 + i * 11} x2={w - 12 - (i === 2 ? 14 : 0)} y2={31 + i * 11} {...line} strokeWidth={1.6} />
          ))}
        </g>
      )
    case 'mobile':
      return (
        <g>
          <rect width={w} height={h} rx={11} {...common} />
          <line x1={w * 0.36} y1={8} x2={w * 0.64} y2={8} {...line} />
          <rect x={6} y={15} width={w - 12} height={h - 32} rx={2} {...line} strokeWidth={1.4} />
          <circle cx={cx} cy={h - 8.5} r={3.4} {...line} strokeWidth={1.6} />
        </g>
      )
    case 'dns': {
      const r = Math.min(w, h) / 2 - 1
      const chord = r * 0.866
      return (
        <g>
          <circle cx={cx} cy={cy} r={r} {...common} />
          <ellipse cx={cx} cy={cy} rx={r * 0.42} ry={r} {...line} strokeWidth={1.6} />
          <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} {...line} strokeWidth={1.6} />
          <line x1={cx - chord} y1={cy - r / 2} x2={cx + chord} y2={cy - r / 2} {...line} strokeWidth={1.6} />
          <line x1={cx - chord} y1={cy + r / 2} x2={cx + chord} y2={cy + r / 2} {...line} strokeWidth={1.6} />
        </g>
      )
    }
    case 'cdn':
      return (
        <g transform={`scale(${w / 100} ${h / 64})`}>
          <path
            d="M24 60 C10 60 2 50 5 40 C7 31 15 27 22 28 C23 15 36 7 48 11 C55 2 73 3 78 16 C89 15 98 25 96 36 C100 45 94 60 80 60 Z"
            {...common}
            vectorEffect="non-scaling-stroke"
          />
          <path d="M30 44 L44 36 L58 44 L72 36" fill="none" stroke={stroke} strokeWidth={1.6} vectorEffect="non-scaling-stroke" strokeLinecap="round" />
          {[30, 44, 58, 72].map((x, i) => (
            <circle key={x} cx={x} cy={i % 2 ? 36 : 44} r={2.6} fill={stroke} />
          ))}
        </g>
      )
    case 'lb': {
      const r = Math.min(w, h) / 2 - 1
      const sx = cx - r * 0.58
      const hx = cx - r * 0.12
      const ends: [number, number][] = [
        [cx + r * 0.52, cy - r * 0.42],
        [cx + r * 0.6, cy],
        [cx + r * 0.52, cy + r * 0.42]
      ]
      return (
        <g>
          <circle cx={cx} cy={cy} r={r} {...common} />
          <line x1={sx} y1={cy} x2={hx} y2={cy} {...line} />
          <circle cx={hx} cy={cy} r={2.8} fill={stroke} />
          {ends.map(([ex, ey], i) => (
            <path key={i} d={`M${hx},${cy} L${ex},${ey} ${head(hx, cy, ex, ey, 6)}`} {...line} />
          ))}
        </g>
      )
    }
    case 'gateway': {
      const top = h * 0.26
      const bot = h * 0.8
      return (
        <g>
          <rect width={w} height={h} rx={9} {...common} />
          {/* an archway that requests pass through */}
          <path d={`M${w * 0.3},${bot} L${w * 0.3},${top + 10} Q${cx},${top - 8} ${w * 0.7},${top + 10} L${w * 0.7},${bot}`} {...line} />
          <path d={`M${w * 0.12},${cy + 4} L${w * 0.88},${cy + 4} ${head(0, cy + 4, w * 0.88, cy + 4, 7)}`} {...line} />
        </g>
      )
    }
    case 'server':
      return (
        <g>
          <rect width={w} height={h} rx={5} {...common} />
          {[1, 2].map((i) => (
            <line key={i} x1={0} y1={(h / 3) * i} x2={w} y2={(h / 3) * i} {...line} />
          ))}
          {[0, 1, 2].map((i) => {
            const y = (h / 3) * i + h / 6
            return (
              <g key={i}>
                <line x1={11} y1={y} x2={w * 0.5} y2={y} {...line} />
                <circle cx={w - 14} cy={y} r={3.3} fill={stroke} />
              </g>
            )
          })}
        </g>
      )
    case 'service':
      return (
        <g>
          <polygon points={`${w * 0.25},0 ${w * 0.75},0 ${w},${cy} ${w * 0.75},${h} ${w * 0.25},${h} 0,${cy}`} {...common} />
          <Glyph icon={Cog} cx={cx} cy={cy} size={Math.min(30, h * 0.4)} color={stroke} />
        </g>
      )
    case 'worker':
      return (
        <g>
          <rect width={w} height={h} rx={12} {...common} />
          <Glyph icon={Cog} cx={cx - 8} cy={cy - 4} size={26} color={stroke} />
          <Glyph icon={Cog} cx={cx + 14} cy={cy + 12} size={18} color={stroke} />
        </g>
      )
    case 'cache': {
      const ry = Math.min(12, h * 0.2)
      return (
        <g>
          <path d={cylinder(w, h, ry)} {...common} />
          <ellipse cx={cx} cy={ry} rx={w / 2} ry={ry} {...common} />
          <Glyph icon={Zap} cx={cx} cy={(h + ry * 2) / 2} size={Math.min(24, h * 0.42)} color={stroke} />
        </g>
      )
    }
    case 'sql':
    case 'nosql': {
      const ry = Math.min(13, h * 0.14)
      const ring = ry + (h - 2 * ry) * 0.3
      return (
        <g>
          <path d={cylinder(w, h, ry)} {...common} />
          <path d={`M0,${ring - ry} A${w / 2},${ry} 0 0 0 ${w},${ring - ry}`} {...line} />
          <ellipse cx={cx} cy={ry} rx={w / 2} ry={ry} {...common} />
          <Glyph icon={kind === 'sql' ? Table2 : Braces} cx={cx} cy={(ring + h) / 2} size={Math.min(26, w * 0.32)} color={stroke} />
        </g>
      )
    }
    case 'storage': {
      const ry = Math.min(12, h * 0.13)
      const by = h - ry * 0.7
      return (
        <g>
          <path d={`M0,${ry} L${w * 0.13},${by} A${w * 0.37},${ry * 0.7} 0 0 0 ${w * 0.87},${by} L${w},${ry}`} {...common} />
          <ellipse cx={cx} cy={ry} rx={w / 2} ry={ry} {...common} />
          <path d={`M${w * 0.06},${h * 0.42} A${w * 0.44},${ry * 0.8} 0 0 0 ${w * 0.94},${h * 0.42}`} {...line} strokeWidth={1.6} />
        </g>
      )
    }
    case 'search': {
      const r = Math.min(13, h * 0.17)
      const mx = w * 0.66
      const my = h * 0.46
      return (
        <g>
          <rect width={w} height={h} rx={8} {...common} />
          {[0, 1, 2].map((i) => (
            <line key={i} x1={12} y1={h * 0.3 + i * 12} x2={w * 0.42 - (i === 2 ? 8 : 0)} y2={h * 0.3 + i * 12} {...line} strokeWidth={1.6} />
          ))}
          <circle cx={mx} cy={my} r={r} {...line} fill="#fff" />
          <line x1={mx + r * 0.72} y1={my + r * 0.72} x2={mx + r * 1.6} y2={my + r * 1.6} {...line} strokeWidth={2.6} />
        </g>
      )
    }
    case 'queue': {
      const slots = 5
      const sw = w / slots
      return (
        <g>
          <rect width={w} height={h} rx={6} {...common} />
          {Array.from({ length: slots - 1 }, (_, i) => (
            <line key={i} x1={sw * (i + 1)} y1={0} x2={sw * (i + 1)} y2={h} {...line} strokeWidth={1.4} />
          ))}
          {[2, 3, 4].map((i) => (
            <rect key={i} x={sw * i + 6} y={h * 0.26} width={sw - 12} height={h * 0.48} rx={3} fill={stroke} opacity={0.75} />
          ))}
        </g>
      )
    }
    case 'rect':
      return <rect width={w} height={h} rx={8} {...common} />
    case 'text':
      return <g />
  }
}

/** Kinds whose label is drawn inside the shape rather than underneath. */
export const labelInside = (k: ShapeKind): boolean => k === 'rect' || k === 'text'

/** Full node: stacked copies, the shape, its ×N badge and label. */
export function ShapeNode({ node }: { node: DiagramNode }): JSX.Element {
  const { kind, w, h, label } = node
  const count = Math.max(1, node.count ?? 1)
  const ghosts = Math.min(count - 1, 2)
  const { stroke } = SHAPE_COLORS[kind]

  if (kind === 'text') {
    return (
      <text className="dl-text" x={0} y={h / 2} dy="0.35em">
        {label}
      </text>
    )
  }

  return (
    <g>
      {Array.from({ length: ghosts }, (_, i) => {
        const o = (ghosts - i) * 7
        return (
          <g key={i} transform={`translate(${o} ${-o})`} opacity={0.75}>
            <ShapeBody kind={kind} w={w} h={h} />
          </g>
        )
      })}
      <ShapeBody kind={kind} w={w} h={h} />
      {count > 1 && (
        <g transform={`translate(${w + ghosts * 7 - 4} ${-ghosts * 7 - 6})`}>
          <rect x={-16} y={-10} width={32} height={20} rx={10} fill={stroke} />
          <text className="dl-badge" x={0} y={0} dy="0.35em" textAnchor="middle">
            ×{count}
          </text>
        </g>
      )}
      {label &&
        (labelInside(kind) ? (
          <text className="dl-label" x={w / 2} y={h / 2} dy="0.35em" textAnchor="middle">
            {label}
          </text>
        ) : (
          <text className="dl-label" x={w / 2} y={h + 17} dy="0.35em" textAnchor="middle">
            {label}
          </text>
        ))}
    </g>
  )
}
