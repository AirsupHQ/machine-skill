// Minimal PNG decoder (8-bit RGB / RGBA, non interlaced: what Chromium screenshots are). No dependencies.
import { inflateSync } from 'node:zlib'
export function decodePNG(buf) {
  let p = 8, w = 0, h = 0, ct = 0
  const idat = []
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), type = buf.toString('ascii', p + 4, p + 8), d = buf.subarray(p + 8, p + 8 + len)
    if (type === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); ct = d[9]; if (d[8] !== 8 || d[12] !== 0) throw new Error('png: only 8-bit non-interlaced') }
    else if (type === 'IDAT') idat.push(d)
    else if (type === 'IEND') break
    p += 12 + len
  }
  const bpp = ct === 6 ? 4 : ct === 2 ? 3 : ct === 0 ? 1 : 0
  if (!bpp) throw new Error('png: unsupported colour type ' + ct)
  const raw = inflateSync(Buffer.concat(idat)), stride = w * bpp, out = Buffer.alloc(h * stride)
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)), row = out.subarray(y * stride, (y + 1) * stride), up = y ? out.subarray((y - 1) * stride, y * stride) : null
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? row[x - bpp] : 0, b = up ? up[x] : 0, c = up && x >= bpp ? up[x - bpp] : 0
      let v = src[x]
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1
      else if (f === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c }
      row[x] = v & 255
    }
  }
  return { w, h, bpp, data: out }
}
/** fraction of sampled pixels that are pink (pinkscan rule) and solid #FF00FF, on a 64 x 36 grid */
export function pinkStats({ w, h, bpp, data }) {
  let pink = 0, solid = 0, n = 0
  for (let j = 0; j < 36; j++) for (let i = 0; i < 64; i++) {
    const x = Math.floor(((i + 0.5) / 64) * w), y = Math.floor(((j + 0.5) / 36) * h), o = (y * w + x) * bpp
    const r = data[o], g = data[o + 1], b = data[o + 2]
    if (r > 150 && b > 110 && g < 0.7 * Math.min(r, b)) pink++
    if (r > 231 && g < 24 && b > 231) solid++
    n++
  }
  return { pink: pink / n, solid: solid / n }
}
