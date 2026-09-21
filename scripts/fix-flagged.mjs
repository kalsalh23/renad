/**
 * RENAD — إصلاح موجّه للصور المتبقية
 * - زوايا التفاصيل: لقطة ماكرو للنسيج فقط (بدون مانيكان أو وجه)
 * - الزوايا المزدوجة: تأكيد صارم على مانيكان واحد فقط
 *
 * الاستخدام:
 *   node scripts/fix-flagged.mjs --token=<sbp_...> --ref=<ref> --anon=<anon-key>
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
  console.error('Usage: node scripts/fix-flagged.mjs --token=<sbp> --ref=<ref> --anon=<key>')
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
  const res = await fetch(`${SUPA}/storage/v1/object/${bucket}/${filePath}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${anon}`, 'Content-Type': contentType, 'x-upsert': 'true' },
    body: buffer,
  })
  if (!res.ok) throw new Error(`upload ${filePath} failed (${res.status}): ${(await res.text()).slice(0, 150)}`)
  return `${SUPA}/storage/v1/object/public/${bucket}/${filePath}`
}

function curlGet(url) {
  return execFileSync('curl', ['-s', '-L', '--max-time', '150', url], { maxBuffer: 64 * 1024 * 1024 })
}

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

const MANNEQUIN =
  'ONE single elegant full-body boutique mannequin alone in the frame, single figure only, no diptych, no collage, no split frame, no second view, realistic sculpted serene face, matte porcelain finish, no real person, no human model, no woman'
const SCENE =
  'photorealistic professional product photography, luxury bridal boutique, elegant soft ivory studio background, warm premium lighting, sharp focus, 8k quality'
const MACRO =
  'extreme macro close-up of the gown fabric filling the entire frame, lace texture and embroidery and beadwork only, no mannequin, no person, no face, no body, flat fabric detail shot'

const DRESSES = {
  'RENAD-012': { seed: 1403, desc: 'luxurious straight column evening gown with heavy crystal beadwork embroidery, champagne silk crepe fabric' },
  'RENAD-045': { seed: 4704, desc: 'soft romantic a-line gown with sheer chiffon sleeves and delicate floral applique, blush white tulle' },
  'RENAD-018': { seed: 2005, desc: 'classic princess ball gown with heart neckline and white pearl beadwork, structured mikado skirt' },
  'RENAD-052': { seed: 5406, desc: 'modern mermaid wedding gown with illusion corset bodice and sculptural skirt, ivory crepe' },
  'RENAD-036': { seed: 3808, desc: 'a-line wedding dress with dense floral lace embroidery and soft chapel train, white tulle over satin' },
}

// الصور المطلوب إصلاحها: [فستان، زاوية، نوع الإصلاح]
const FIXES = [
  ['RENAD-012', 1, 'single'],
  ['RENAD-012', 2, 'single'],
  ['RENAD-045', 3, 'macro'],
  ['RENAD-018', 3, 'macro'],
  ['RENAD-052', 0, 'single'],
  ['RENAD-052', 1, 'single'],
  ['RENAD-052', 2, 'single'],
  ['RENAD-036', 3, 'macro'],
]

const ANGLES_KEY = ['front', 'side', 'back', 'detail']
const ANGLE_PHRASES = [
  'front view of the gown on the mannequin',
  'three-quarter side angle view of the gown on the mannequin',
  'back view of the gown on the mannequin showing the train and back details',
  'detail shot',
]
const ANGLE_LABELS = ['من الأمام', 'من الجانب', 'من الخلف', 'تفاصيل القماش']

console.log('Applying targeted fixes...')
const affectedDresses = [...new Set(FIXES.map(([code]) => code))]
for (const code of affectedDresses) {
  const d = DRESSES[code]
  console.log(`  → ${code}`)
  const fixes = FIXES.filter(([c]) => c === code)
  for (const [, angleIdx, kind] of fixes) {
    const prompt =
      kind === 'macro'
        ? `${d.desc}, ${MACRO}, ${SCENE}`
        : `${d.desc}, ${ANGLE_PHRASES[angleIdx]}, ${MANNEQUIN}, ${SCENE}`
    try {
      await generateAI(prompt, 900, 1200, d.seed, `v2-${code}-${ANGLES_KEY[angleIdx]}`)
      console.log(`    ✓ ${ANGLES_KEY[angleIdx]} (${kind})`)
    } catch (e) {
      console.log(`    ⚠ ${ANGLES_KEY[angleIdx]}: ${e.message}`)
    }
  }

  // رفع زوايا الفستان الأربع كاملة من الكاش وتحديث صفوفها
  const urls = []
  let ok = true
  for (let i = 0; i < 4; i++) {
    const f = path.join(CACHE, `v2-${code}-${ANGLES_KEY[i]}.jpg`.replace(/[^\w.-]/g, '_'))
    if (!existsSync(f)) {
      ok = false
      break
    }
    const url = await uploadBuffer(readFileSync(f), 'dress-images', `${code}/img-${i}.jpg`, 'image/jpeg')
    urls.push(url)
  }
  if (ok) {
    let sql = `begin;\n`
    sql += `delete from public.dress_images where dress_id in (select id from public.dresses where code = '${code}');\n`
    sql += `insert into public.dress_images (dress_id, url, sort_order, alt)\n`
    sql += `select id, u.url, u.ord, u.alt from public.dresses, (values ${urls.map((u, i) => `('${u}', ${i}, '${ANGLE_LABELS[i]}')`).join(', ')}) as u(url, ord, alt)\n`
    sql += `where public.dresses.code = '${code}';\n`
    sql += `update public.dresses set cover_image = '${urls[0]}' where code = '${code}';\n`
    sql += `commit;\n`
    await runSql(sql)
    console.log(`    ✓ DB updated for ${code}`)
  } else {
    console.log(`    ⚠ skipped DB update for ${code}`)
  }
}
console.log('\n✅ TARGETED FIXES DONE')
