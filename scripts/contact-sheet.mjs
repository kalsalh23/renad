/** بناء لوحة مصغرات لفحص جودة الصور المولّدة */
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dir = path.join(__dirname, '.cache-ai')
const dresses = ['RENAD-024', 'RENAD-031', 'RENAD-012', 'RENAD-045', 'RENAD-018', 'RENAD-052', 'RENAD-007', 'RENAD-036']
const angles = ['front', 'side', 'back', 'detail']

const W = 240, H = 320, COLS = 4
const comps = []
let missing = 0

for (let r = 0; r < dresses.length; r++) {
  for (let c = 0; c < angles.length; c++) {
    const f = path.join(dir, `v2-${dresses[r]}-${angles[c]}.jpg`)
    if (!fs.existsSync(f)) {
      console.log('MISSING', dresses[r], angles[c])
      missing++
      continue
    }
    const buf = await sharp(f).resize(W, H, { fit: 'cover' }).toBuffer()
    comps.push({ input: buf, left: c * W, top: r * H })
  }
}

const rows = Math.ceil(comps.length / COLS)
await sharp({ create: { width: W * COLS, height: H * rows, channels: 3, background: '#222222' } })
  .composite(comps)
  .jpeg({ quality: 80 })
  .toFile(path.join(__dirname, '..', 'contact-sheet.jpg'))

console.log(`sheet done: ${comps.length} images, missing: ${missing}`)
