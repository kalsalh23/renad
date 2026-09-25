/** توليد أيقونات PWA من SVG الشعار */
import sharp from 'sharp'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '..', 'public', 'icons')
mkdirSync(outDir, { recursive: true })

// هوية الموقع: خلفية داكنة + حرف ذهبي (الموقع الأساسي)
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#211D18"/>
  <rect x="26" y="26" width="460" height="460" rx="90" fill="none" stroke="#AE8B4F" stroke-width="12"/>
  <text x="256" y="352" font-family="Georgia, 'Times New Roman', serif" font-size="270" fill="#CDB182" text-anchor="middle">R</text>
</svg>`

const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'maskable-512.png', size: 512, maskable: true },
  { name: 'apple-touch-icon.png', size: 180 },
]

for (const s of sizes) {
  // maskable يحتاج منطقة أمان: المحتوى داخل 80% من الأيقونة
  const inner = s.maskable
    ? svg.replace('font-size="270"', 'font-size="216"').replace('y="352"', 'y="326"').replace('rx="112"', 'rx="0"').replace('stroke-width="12"', 'stroke-width="0"').replace('x="26" y="26" width="460" height="460" rx="0"', 'width="512" height="512"')
    : svg
  await sharp(Buffer.from(inner)).resize(s.size, s.size).png().toFile(path.join(outDir, s.name))
  console.log('✓', s.name)
}
