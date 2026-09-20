/**
 * RENAD — إعادة توليد الصور بالذكاء الاصطناعي
 * - صور فساتين فقط (بدون أي إنسان) لكل فستان بعدة زوايا متطابقة (نفس البذرة + نفس الوصف)
 * - صورة Hero جديدة: مجموعة فساتين بألوان الهوية + اسم البراند مركّب عليها
 * - يحدّث dress_images و cover_image و hero_image في قاعدة البيانات
 * - يحذف إطارات 360° (أُلغيت الميزة)
 *
 * الاستخدام:
 *   node scripts/regenerate-images.mjs --token=<sbp_...> --ref=<ref> --anon=<anon-key>
 */
import sharp from 'sharp'
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CACHE = path.join(__dirname, '.cache-ai')
mkdirSync(CACHE, { recursive: true })

let token = '', ref = '', anon = ''
for (const a of process.argv.slice(2)) {
  if (a.startsWith('--token=')) token = a.slice(8)
  else if (a.startsWith('--ref=')) ref = a.slice(6)
  else if (a.startsWith('--anon=')) anon = a.slice(7)
}
if (!token || !ref || !anon) {
  console.error('Usage: node scripts/regenerate-images.mjs --token=<sbp> --ref=<ref> --anon=<key>')
  process.exit(1)
}
const SUPA = `https://${ref}.supabase.co`

async function runSql(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`SQL failed: ${text.slice(0, 400)}`)
  return text
}

async function uploadBuffer(buffer, bucket, filePath, contentType) {
  const url = `${SUPA}/storage/v1/object/${bucket}/${filePath}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${anon}`, 'Content-Type': contentType, 'x-upsert': 'true' },
    body: buffer,
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`upload ${filePath} failed (${res.status}): ${t.slice(0, 200)}`)
  }
  return `${SUPA}/storage/v1/object/public/${bucket}/${filePath}`
}

function curlGet(url) {
  return execFileSync('curl', ['-s', '-L', '--max-time', '150', url], { maxBuffer: 64 * 1024 * 1024 })
}

/** توليد صورة AI عبر Pollinations — نص إنجليزي صارم: فستان فقط بدون أي إنسان */
async function generateAI(prompt, width, height, seed, cacheKey) {
  const cachePath = path.join(CACHE, cacheKey.replace(/[^\w.-]/g, '_') + '.jpg')
  if (existsSync(cachePath)) return readFileSync(cachePath)

  const noHuman = 'headless mannequin display stand, dress only, no people, no model, no woman, no person, no face, no hands, no human body'
  const style = 'luxury bridal boutique product photography, elegant soft ivory studio background, warm premium lighting, high detail, centered composition'
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(`${prompt}, ${noHuman}, ${style}`)}?width=${width}&height=${height}&nologo=true&seed=${seed}`

  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const buf = curlGet(url)
      if (!buf || buf.length < 8000) throw new Error(`too small (${buf?.length ?? 0}b)`)
      const meta = await sharp(buf).metadata()
      if (meta.width < 400) throw new Error('bad image')
      const out = await sharp(buf).resize(width, height, { fit: 'cover' }).jpeg({ quality: 84, mozjpeg: true }).toBuffer()
      writeFileSync(cachePath, out)
      return out
    } catch (e) {
      console.log(`    attempt ${attempt} failed: ${e.message}`)
      if (attempt === 4) throw new Error(`generation failed for ${cacheKey}`)
      await new Promise((r) => setTimeout(r, 5000 * attempt))
    }
  }
}

/* ============== تعريفات الفساتين ============== */
// نفس البذرة لكل فستان + نفس الوصف الأساسي مع تغيير الزاوية فقط → أقصى تطابق ممكن بين الزوايا
const DRESSES = [
  { code: 'RENAD-024', seed: 2401, desc: 'elegant mermaid silhouette wedding gown with pearl beaded bodice and long flowing train, ivory white mikado and tulle fabric' },
  { code: 'RENAD-031', seed: 3102, desc: 'royal ball gown wedding dress with french lace bodice and crystal belt, dramatic long royal train, pure white organza' },
  { code: 'RENAD-012', seed: 1203, desc: 'luxurious straight column evening gown with heavy crystal beadwork embroidery, champagne silk crepe fabric' },
  { code: 'RENAD-045', seed: 4504, desc: 'soft romantic a-line gown with sheer chiffon sleeves and delicate floral applique, blush white tulle' },
  { code: 'RENAD-018', seed: 1805, desc: 'classic princess ball gown with heart neckline and white pearl beadwork, structured mikado skirt' },
  { code: 'RENAD-052', seed: 5206, desc: 'modern mermaid wedding gown with illusion corset bodice and sculptural skirt, ivory crepe' },
  { code: 'RENAD-007', seed: 717, desc: 'minimalist silk slip wedding dress with delicate hand-sewn edge details, pure white charmeuse silk' },
  { code: 'RENAD-036', seed: 3608, desc: 'a-line wedding dress with dense floral lace embroidery and soft chapel train, white tulle over satin' },
]

const ANGLES = [
  { key: 'front',  phrase: 'front view of the gown' },
  { key: 'side',   phrase: 'three-quarter side angle view of the same gown' },
  { key: 'back',   phrase: 'back view of the same gown showing the train and back details' },
  { key: 'detail', phrase: 'close-up detail shot of the same gown fabric texture and embroidery' },
]

/* ============== 1) صور الفساتين ============== */
const urlsByDress = {}
console.log('1) Generating dress images (4 angles each, dress only, no people)...')
for (const d of DRESSES) {
  console.log(`  → ${d.code}`)
  urlsByDress[d.code] = []
  for (let i = 0; i < ANGLES.length; i++) {
    const a = ANGLES[i]
    try {
      const buf = await generateAI(`${d.desc}, ${a.phrase}`, 900, 1200, d.seed, `${d.code}-${a.key}`)
      const url = await uploadBuffer(buf, 'dress-images', `${d.code}/img-${i}.jpg`, 'image/jpeg')
      urlsByDress[d.code].push(url)
      console.log(`    ✓ ${a.key}`)
    } catch (e) {
      console.log(`    ⚠ keeping existing image for ${a.key}: ${e.message}`)
      urlsByDress[d.code].push(null) // نُبقي الصورة القديمة عبر عدم تحديث هذا الصف
    }
  }
}

/* ============== 2) صورة Hero ============== */
console.log('2) Generating hero image (brand + gown collection)...')
let heroUrl = null
try {
  const heroBuf = await generateAI(
    'elegant display of five luxury bridal gowns in different colors — ivory, champagne, blush, soft gold and sage — standing in a row on headless mannequins inside a luxurious bright atelier with marble floor, editorial wide shot',
    1800, 1200, 9425, 'hero-collection',
  )
  // تركيب اسم البراند على الصورة بخط أنيق
  const brandSvg = Buffer.from(`<svg width="1800" height="1200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#211D18" stop-opacity="0.55"/>
        <stop offset="0.22" stop-color="#211D18" stop-opacity="0"/>
        <stop offset="0.8" stop-color="#211D18" stop-opacity="0"/>
        <stop offset="1" stop-color="#211D18" stop-opacity="0.45"/>
      </linearGradient>
    </defs>
    <rect width="1800" height="1200" fill="url(#shade)"/>
    <text x="900" y="200" font-family="Georgia, 'Times New Roman', serif" font-size="150" letter-spacing="46" fill="#E9D9B8" text-anchor="middle" font-weight="normal">RENAD</text>
    <line x1="700" y1="248" x2="1100" y2="248" stroke="#CDB182" stroke-width="2"/>
    <text x="900" y="300" font-family="Georgia, serif" font-size="40" letter-spacing="22" fill="#D8C5A0" text-anchor="middle">BRIDAL ATELIER</text>
  </svg>`)
  const heroFinal = await sharp(heroBuf).composite([{ input: brandSvg }]).jpeg({ quality: 86, mozjpeg: true }).toBuffer()
  heroUrl = await uploadBuffer(heroFinal, 'hero-images', 'hero/hero.jpg', 'image/jpeg')
  console.log('  ✓ hero with brand wordmark')
} catch (e) {
  console.log(`  ⚠ hero generation failed, keeping existing: ${e.message}`)
}

/* ============== 3) SQL ============== */
console.log('3) Applying database updates...')
let sql = `begin;\n`
sql += `delete from public.dress_360_frames;\n`

for (const d of DRESSES) {
  const urls = urlsByDress[d.code]
  // لا نستبدل إلا إذا نجحت الزوايا الأربع كلها — لضمان صور مطابقة ومكتملة
  if (urls.every(Boolean)) {
    sql += `delete from public.dress_images where dress_id in (select id from public.dresses where code = '${d.code}');\n`
    const rows = urls
      .map((u, i) => `('${u}', ${i}, '${a2angle(i)}')`)
      .join(', ')
    sql += `insert into public.dress_images (dress_id, url, sort_order, alt)\n`
    sql += `select id, u.url, u.ord, u.alt from public.dresses, (values ${rows}) as u(url, ord, alt)\n`
    sql += `where public.dresses.code = '${d.code}';\n`
    sql += `update public.dresses set cover_image = '${urls[0]}' where code = '${d.code}';\n`
  }
}
function a2angle(i) {
  return ['من الأمام', 'من الجانب', 'من الخلف', 'تفاصيل القماش'][i] ?? ''
}

if (heroUrl) {
  sql += `update public.business_settings set hero_image = '${heroUrl}' where id = 1;\n`
}
sql += `commit;\n`
await runSql(sql)
writeFileSync(path.join(__dirname, '..', 'supabase', '006_ai_images.sql'), sql)
console.log('\n✅ AI IMAGE REGENERATION COMPLETE')
