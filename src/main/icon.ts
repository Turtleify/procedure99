import { nativeImage, type NativeImage } from 'electron'

/**
 * Draws the Blueprint logo (three connected nodes on a gradient disc) into a
 * BGRA bitmap so the app ships without any binary icon assets.
 */
const NODES: [number, number][] = [
  [0.5, 0.3],
  [0.29, 0.68],
  [0.71, 0.68]
]
const SEGMENTS: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 2]
]

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v))
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t

function distToSegment(px: number, py: number, a: [number, number], b: [number, number]): number {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const t = clamp01(((px - a[0]) * dx + (py - a[1]) * dy) / (dx * dx + dy * dy))
  return Math.hypot(px - (a[0] + t * dx), py - (a[1] + t * dy))
}

export function makeIcon(size: number, accent?: [number, number, number]): NativeImage {
  const buf = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const px = (x + 0.5) / size
      const py = (y + 0.5) / size
      const bgA = clamp01((0.48 - Math.hypot(px - 0.5, py - 0.5)) * size + 0.5)

      // vertical gradient indigo -> violet (or a custom accent, e.g. for the tray "done" state)
      const top = accent ?? [108, 140, 255]
      const bottom = accent ? accent.map((c) => c * 0.75) : [160, 100, 255]
      let r = lerp(top[0], bottom[0], py)
      let g = lerp(top[1], bottom[1], py)
      let b = lerp(top[2], bottom[2], py)

      let fg = 0
      for (const [i, j] of SEGMENTS) {
        fg = Math.max(fg, clamp01((0.035 - distToSegment(px, py, NODES[i], NODES[j])) * size + 0.5))
      }
      for (const n of NODES) {
        fg = Math.max(fg, clamp01((0.1 - Math.hypot(px - n[0], py - n[1])) * size + 0.5))
      }
      r = lerp(r, 255, fg)
      g = lerp(g, 255, fg)
      b = lerp(b, 255, fg)

      // premultiplied BGRA
      const i = (y * size + x) * 4
      buf[i] = Math.round(b * bgA)
      buf[i + 1] = Math.round(g * bgA)
      buf[i + 2] = Math.round(r * bgA)
      buf[i + 3] = Math.round(bgA * 255)
    }
  }
  return nativeImage.createFromBitmap(buf, { width: size, height: size })
}
