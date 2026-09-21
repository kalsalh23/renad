/**
 * RENAD — إعادة توليد الصور بالذكاء الاصطناعي (v2)
 * - فستان على مانيكان أنيق بوجه واقعي (بدون أي شخص حقيقي) — إصلاح التشوه
 * - زوايا متطابقة لكل فستان (نفس البذرة + نفس الوصف)
 * - Hero: اسم البراند بحجم متناسب مع الجوال
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

/** توليد صورة AI — الـprompt هنا كامل ومفصّل لضمان واقعية عالية */
async function generateAI(fullPrompt, width, height, seed, cacheKey) {
  const cachePath = path.join(CACHE, cacheKey.replace(/[^\w.-]/g, '_') + '.jpg')
  if (existsSync(cachePath)) return readFileSync(cachePath)

  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=${width}&height=${height}&nologo=true&seed=${seed}`

  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const buf = curlGet(url)
      if (!buf || buf.length < 8000) throw new Error(`too small (${buf?.length ?? 0}b)`)
      const meta = await sharp(buf).metadata()
      if (meta.width < 400) throw new Error('bad image')
      // إزالة العلامة المائية أسفل يمين الصورة بقصّ الشريط السفلي (5%) ثم إعادة التأطير
      const cropBottom = Math.round(meta.height * 0.05)
      const cropped = await sharp(buf)
        .extract({ left: 0, top: 0, width: meta.width, height: meta.height - cropBottom })
        .toBuffer()
      const out = await sharp(cropped).resize(width, height, { fit: 'cover' }).jpeg({ quality: 86, mozjpeg: true }).toBuffer()
      writeFileSync(cachePath, out)
      return out
    } catch (e) {
      console.log(`    attempt ${attempt} failed: ${e.message}`)
      if (attempt === 4) throw new Error(`generation failed for ${cacheKey}`)
      await new Promise((r) => setTimeout(r, 5000 * attempt))
    }
  }
}

// وصف المانيكان الواقعي — مانيكان صالة عرض كامل الجسم بوجه طبيعي، بدون أي شخص حقيقي
const MANNEQUIN =
  'displayed on an elegant full-body luxury boutique mannequin with a realistic sculpted face and smooth matte finish, standing gracefully, mannequin only, no real person, no human model, no woman, no photograph of a person'
const SCENE =
  'photorealistic professional product photography for a luxury bridal boutique, elegant soft ivory studio background with warm premium lighting, sharp focus, high detail, centered composition, 8k quality'

/* ============== تعريفات الفساتين ============== */
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
  { key: 'front',  phrase: 'front view of the gown on the mannequin' },
  { key: 'side',   phrase: 'three-quarter side angle view of the same gown on the same mannequin' },
  { key: 'back',   phrase: 'back view of the same gown on the same mannequin showing the train and back details' },
]

/* ============== 1) صور الفساتين ============== */
const urlsByDress = {}
console.log('1) Generating dress images (realistic mannequin, 3 angles + detail)...')
for (const d of DRESSES) {
  console.log(`  → ${d.code}`)
  urlsByDress[d.code] = []
  const shots = [
    ...ANGLES.map((a) => ({ key: a.key, prompt: `${d.desc}, ${a.phrase}, ${MANNEQUIN}, ${SCENE}` })),
    { key: 'detail', prompt: `macro close-up detail shot of ${d.desc}, fabric texture and embroidery details, draped on the mannequin, no person, ${SCENE}` },
  ]
  for (let i = 0; i < shots.length; i++) {
    const s = shots[i]
    try {
      const buf = await generateAI(s.prompt, 900, 1200, d.seed, `v2-${d.code}-${s.key}`)
      const url = await uploadBuffer(buf, 'dress-images', `${d.code}/img-${i}.jpg`, 'image/jpeg')
      urlsByDress[d.code].push(url)
      console.log(`    ✓ ${s.key}`)
    } catch (e) {
      console.log(`    ⚠ failed: ${s.key} — ${e.message}`)
      urlsByDress[d.code].push(null)
    }
  }
}

/* ============== 2) صورة Hero ============== */
console.log('2) Generating hero image (brand + gown collection)...')
let heroUrl = null
try {
  const heroBuf = await generateAI(
    'elegant display of five luxury bridal gowns in different colors — ivory, champagne, blush, soft gold and sage — on graceful boutique mannequins standing in a row inside a luxurious bright atelier with marble floor, soft warm light, photorealistic editorial wide shot, no real person, high detail',
    1800, 1200, 9425, 'v2-hero-collection',
  )
  // اسم البراند بحجم متناسب مع شاشات الجوال (يبقى كاملًا داخل منطقة القص المركزي)
  const brandSvg = Buffer.from(`<svg width="1800" height="1200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#211D18" stop-opacity="0.50"/>
        <stop offset="0.20" stop-color="#211D18" stop-opacity="0"/>
        <stop offset="0.8" stop-color="#211D18" stop-opacity="0"/>
        <stop offset="1" stop-color="#211D18" stop-opacity="0.45"/>
      </linearGradient>
    </defs>
    <rect width="1800" height="1200" fill="url(#shade)"/>
    <text x="900" y="170" font-family="Georgia, 'Times New Roman', serif" font-size="84" letter-spacing="18" fill="#E9D9B8" text-anchor="middle">RENAD</text>
    <line x1="790" y1="206" x2="1010" y2="206" stroke="#CDB182" stroke-width="1.6"/>
    <text x="900" y="248" font-family="Georgia, serif" font-size="26" letter-spacing="12" fill="#D8C5A0" text-anchor="middle">BRIDAL ATELIER</text>
  </svg>`)
  const heroFinal = await sharp(heroBuf).composite([{ input: brandSvg }]).jpeg({ quality: 86, mozjpeg: true }).toBuffer()
  heroUrl = await uploadBuffer(heroFinal, 'hero-images', 'hero/hero.jpg', 'image/jpeg')
  console.log('  ✓ hero with compact brand wordmark')
} catch (e) {
  console.log(`  ⚠ hero generation failed, keeping existing: ${e.message}`)
}

/* ============== 3) SQL ============== */
console.log('3) Applying database updates...')
function angleLabel(i) {
  return ['من الأمام', 'من الجانب', 'من الخلف', 'تفاصيل القماش'][i] ?? ''
}
let sql = `begin;\n`
sql += `delete from public.dress_360_frames;\n`

for (const d of DRESSES) {
  const urls = urlsByDress[d.code]
  // لا نستبدل إلا إذا نجحت الزوايا الأربع كلها — لضمان صور مطابقة ومكتملة
  if (urls.every(Boolean)) {
    sql += `delete from public.dress_images where dress_id in (select id from public.dresses where code = '${d.code}');\n`
    const rows = urls.map((u, i) => `('${u}', ${i}, '${angleLabel(i)}')`).join(', ')
    sql += `insert into public.dress_images (dress_id, url, sort_order, alt)\n`
    sql += `select id, u.url, u.ord, u.alt from public.dresses, (values ${rows}) as u(url, ord, alt)\n`
    sql += `where public.dresses.code = '${d.code}';\n`
    sql += `update public.dresses set cover_image = '${urls[0]}' where code = '${d.code}';\n`
  }
}

if (heroUrl) {
  sql += `update public.business_settings set hero_image = '${heroUrl}' where id = 1;\n`
}
sql += `commit;\n`
await runSql(sql)
writeFileSync(path.join(__dirname, '..', 'supabase', '006_ai_images.sql'), sql)
console.log('\n✅ AI IMAGE REGENERATION (v2) COMPLETE')
