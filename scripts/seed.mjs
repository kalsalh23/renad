/**
 * RENAD — سكربت البيانات الأولية
 * 1) يجلب صور فساتين حقيقية (Unsplash) ويصادق عليها
 * 2) يولّد 36 إطار 360° لفستان العرض (تأثير دوران)
 * 3) يرفع كل شيء إلى Supabase Storage (سياسة الرفع المؤقتة يجب أن تكون فعّالة)
 * 4) ينشئ SQL البيانات ويطبّقه عبر Management API
 *
 * الاستخدام:
 *   node scripts/seed.mjs --token=<sbp_...> --ref=<ref> --anon=<anon-key>
 */
import sharp from 'sharp'
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CACHE = path.join(__dirname, '.cache')
mkdirSync(CACHE, { recursive: true })

let token = '', ref = '', anon = ''
for (const a of process.argv.slice(2)) {
  if (a.startsWith('--token=')) token = a.slice(8)
  else if (a.startsWith('--ref=')) ref = a.slice(6)
  else if (a.startsWith('--anon=')) anon = a.slice(7)
}
if (!token || !ref || !anon) {
  console.error('Usage: node scripts/seed.mjs --token=<sbp> --ref=<ref> --anon=<key>')
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
  if (!res.ok) throw new Error(`SQL failed: ${text.slice(0, 500)}`)
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

/** جلب عبر curl — الهوية الافتراضية تنجح بينما UA المتصفح يفعّل حجب البوتات */
function curlGet(url) {
  return execFileSync('curl', ['-s', '-L', '--max-time', '90', url], { maxBuffer: 64 * 1024 * 1024 })
}

async function downloadImage(url, key) {
  const cachePath = path.join(CACHE, key.replace(/[^\w.-]/g, '_') + '.jpg')
  if (existsSync(cachePath)) return readFileSync(cachePath)
  const buf = curlGet(url)
  if (!buf || buf.length < 5000) throw new Error('download failed (too small)')
  // تصديق الصورة + تصغيرها لعرض ويب مثالي
  const meta = await sharp(buf).metadata()
  if (meta.width < 500) throw new Error('image too small')
  const out = await sharp(buf).resize(1100, 1600, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true }).toBuffer()
  writeFileSync(cachePath, out)
  return out
}

/** سحب روابط الصور مباشرة من صفحات بحث Unsplash */
async function searchUnsplash(query, count) {
  const page = `https://unsplash.com/s/photos/${encodeURIComponent(query)}`
  try {
    const html = curlGet(page).toString('utf8')
    const matches = html.match(/https:\/\/images\.unsplash\.com\/photo-[a-zA-Z0-9-]+/g) ?? []
    const unique = [...new Set(matches)].slice(0, count)
    return unique.map((u) => `${u}?w=1200&q=80&auto=format&fit=crop`)
  } catch (e) {
    console.log(`  unsplash page failed for "${query}": ${e.message}`)
    return []
  }
}

/** صورة احتياطية أنيقة إذا تعذّر جلب الصور */
async function placeholderBuffer(label) {
  const svg = `<svg width="1100" height="1600" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#F4EEE2"/><stop offset="1" stop-color="#EDE1C8"/></linearGradient></defs>
    <rect width="1100" height="1600" fill="url(#g)"/>
    <rect x="24" y="24" width="1052" height="1552" fill="none" stroke="#CDB182" stroke-width="3"/>
    <text x="550" y="780" font-family="Georgia, serif" font-size="72" fill="#AE8B4F" text-anchor="middle">RENAD</text>
    <text x="550" y="850" font-family="Arial" font-size="34" fill="#A79A87" text-anchor="middle">${label}</text>
  </svg>`
  return sharp(Buffer.from(svg)).jpeg({ quality: 85 }).toBuffer()
}

/* ============== 1) جمع الصور ============== */
console.log('1) Fetching image pool from Unsplash...')
const queries = [
  ['wedding-dress', 30],
  ['bridal-gown', 25],
  ['wedding-dress-detail', 15],
  ['bride-portrait', 15],
  ['boutique-interior', 10],
]
let pool = []
for (const [q, n] of queries) {
  const urls = await searchUnsplash(q, n)
  pool.push(...urls)
  if (pool.length > 95) break
}
pool = [...new Set(pool)]
console.log(`  pool size: ${pool.length}`)

let cursor = 0
async function nextImage(label) {
  // جرّب حتى نجاح واحدة، وإلا صورة احتياطية
  for (let tries = 0; tries < 6 && cursor < pool.length; tries++) {
    const url = pool[cursor++]
    const key = url.split('/photo-')[1]?.split('?')[0] ?? String(cursor)
    try {
      return await downloadImage(url, key)
    } catch (e) {
      // المتابعة للصورة التالية
    }
  }
  console.log(`  ⚠ fallback placeholder for ${label}`)
  return placeholderBuffer(label)
}

/* ============== 2) الرفع ============== */
const uploaded = { hero: null, categories: {}, showroom: [], dresses: {} }

console.log('2) Uploading hero...')
{
  const buf = await nextImage('hero')
  // Hero أفقية عريضة
  const heroBuf = await sharp(buf).resize(1800, 1200, { fit: 'cover' }).jpeg({ quality: 84, mozjpeg: true }).toBuffer()
  uploaded.hero = await uploadBuffer(heroBuf, 'hero-images', 'hero/hero.jpg', 'image/jpeg')
  console.log('  ✓ hero')
}

console.log('2) Uploading category images...')
const CATS = ['wedding', 'luxury', 'soft', 'classic', 'modern', 'rent', 'sale']
for (const slug of CATS) {
  const buf = await nextImage(`cat-${slug}`)
  const cover = await sharp(buf).resize(900, 1125, { fit: 'cover' }).jpeg({ quality: 80, mozjpeg: true }).toBuffer()
  uploaded.categories[slug] = await uploadBuffer(cover, 'gallery-images', `categories/${slug}.jpg`, 'image/jpeg')
  console.log(`  ✓ ${slug}`)
}

console.log('2) Uploading showroom images...')
for (let i = 0; i < 6; i++) {
  const buf = await nextImage(`showroom-${i}`)
  const shot = await sharp(buf).resize(1000, 1250, { fit: 'cover' }).jpeg({ quality: 78, mozjpeg: true }).toBuffer()
  uploaded.showroom.push(await uploadBuffer(shot, 'gallery-images', `showroom/showroom-${i}.jpg`, 'image/jpeg'))
  console.log(`  ✓ showroom ${i + 1}`)
}

/* ============== 3) توليد إطارات 360 ============== */
console.log('3) Generating 360 frames...')
const FRAMES = 36
let frameBuffers = []
{
  const base = await nextImage('spin-base')
  // نحوّلها لخلفية عمودية موحدة
  const baseImg = await sharp(base).resize(1000, 1400, { fit: 'cover' }).toBuffer()
  const deg = 2 * Math.PI / FRAMES
  for (let i = 0; i < FRAMES; i++) {
    const theta = i * deg
    // محاكاة دوران حول المحور الرأسي: انكماش أفقي + انعكاس ناعم + ظل متحرك
    const cos = Math.cos(theta)
    const sx = Math.max(Math.abs(cos), 0.12) * (cos < 0 ? -1 : 1)
    const highlight = Math.round(60 * Math.abs(Math.sin(theta / 2)))
    const svgOverlay = `<svg width="800" height="1120" xmlns="http://www.w3.org/2000/svg">
      <rect width="800" height="1120" fill="white" opacity="${(highlight / 500).toFixed(3)}"/>
      <rect x="0" y="0" width="${Math.round(800 * (0.5 - cos * 0.35))}" height="1120" fill="black" opacity="0.06"/>
    </svg>`
    const frame = await sharp(baseImg)
      .affine([[sx, 0], [0, 1]], { background: '#F4EEE2' })
      .extend({ top: 0, bottom: 0, left: Math.max(0, Math.round((1000 - Math.abs(sx) * 1000) / 2)), right: Math.max(0, Math.round((1000 - Math.abs(sx) * 1000) / 2)), background: '#F4EEE2' })
      .resize(800, 1120, { fit: 'contain', background: '#F4EEE2' })
      .composite([{ input: Buffer.from(svgOverlay), blend: 'over' }])
      .webp({ quality: 74 })
      .toBuffer()
    frameBuffers.push(frame)
  }
  console.log(`  ✓ ${FRAMES} frames generated`)
}

/* ============== 4) الفساتين ============== */
console.log('4) Building dresses...')
const DRESSES = [
  { code: 'RENAD-024', cat: 'wedding', name: 'فستان زفاف بتاج اللؤلؤ', desc: 'فستان زفاف بقصّة حورية وتطريز لؤلؤي يدوي ينسدل من الكتف حتى الذيل، مع قماش تول ناعم يعطي حركة راقية مع كل خطوة.', design: 'حورية Mermaid', sizes: ['S', 'M', 'L'], colors: ['أبيض', 'عاجي'], fabric: 'تول مطرز + ساتان', sale: 1500, rent: 350, avail: 'both', status: 'available', display: 'images', featured: true, discount: 10 },
  { code: 'RENAD-031', cat: 'wedding', name: 'فستان زفاف بذيل ملكي', desc: 'ذيل ملكي بطول 1.5 متر مع تفاصيل دانتيل فرنسي وحزام مرصّع بالكريستال — الفستان الذي يصنع لحظة الدخول.', design: 'Ball Gown', sizes: ['M', 'L', 'XL'], colors: ['أبيض'], fabric: 'دانتيل فرنسي + أورجانزا', sale: null, rent: 400, avail: 'rent', status: 'available', display: 'images', featured: true, discount: 0 },
  { code: 'RENAD-012', cat: 'luxury', name: 'فستان سهرة فخم مطرّز', desc: 'قطعة فاخرة بتطريز كثيف من الخرز والكريستال على قماش كريب ثقيل، لسهرة لا تُنسى أو زفاف صغير.', design: 'Straight', sizes: ['S', 'M'], colors: ['شمبانيا'], fabric: 'كريب مطرّز', sale: 2200, rent: null, avail: 'sale', status: 'available', display: 'images', featured: false, discount: 0 },
  { code: 'RENAD-045', cat: 'soft', name: 'فستان ناعم بأكمام شيفون', desc: 'أكمام شيفون شفافة وتنورة منسدلة بحنان — مثالي لزفاف الحديقة والمناسبات النهارية.', design: 'A-Line', sizes: ['XS', 'S', 'M'], colors: ['أبيض وردي'], fabric: 'شيفون حريري', sale: null, rent: 300, avail: 'rent', status: 'available', display: 'images', featured: false, discount: 15 },
  { code: 'RENAD-018', cat: 'classic', name: 'فستان كلاسيكي بقصّة أميرة', desc: 'الكلاسيكية في أنقى صورها: قصّة أميرة بخصرات دقيقة وياقة قلب مطرزة بالخرز الأبيض.', design: 'Princess', sizes: ['S', 'M', 'L'], colors: ['أبيض'], fabric: 'ميكلين + خرز', sale: 1800, rent: 300, avail: 'both', status: 'available', display: 'images', featured: false, discount: 0 },
  { code: 'RENAD-052', cat: 'modern', name: 'فستان عصري بتنورة ميروارد', desc: 'تصميم جريء بتنورة ميروارد وكورسيه شفاف التفاصيل — للعروس التي تريد بصمة مختلفة.', design: 'Mermaid', sizes: ['XS', 'S', 'M'], colors: ['عاجي'], fabric: 'كريب + تول', sale: null, rent: 450, avail: 'rent', status: 'available', display: 'images', featured: true, discount: 0 },
  { code: 'RENAD-007', cat: 'classic', name: 'فستان كلاسيكي حريري', desc: 'حرير طبيعي بلمسة مينيمال وتفاصيل يدوية دقيقة — أُبِع للتو ولم يلبس في حفل بعد.', design: 'Slip', sizes: ['M'], colors: ['أبيض'], fabric: 'حرير طبيعي', sale: 1200, rent: null, avail: 'sale', status: 'sold', display: 'images', featured: false, discount: 0 },
  { code: 'RENAD-036', cat: 'wedding', name: 'فستان 360° — ذيل مشجر', desc: 'فستان زفاف بتطريز مشجر كثيف وذيل ناعم — صوّرناه بتقنية 360° لتري كل تفصيلة قبل زيارتك.', design: 'A-Line', sizes: ['S', 'M'], colors: ['أبيض'], fabric: 'تول مطرز مشجر', sale: null, rent: 500, avail: 'rent', status: 'available', display: 'both', featured: true, discount: 0 },
]

const sqlValues = []
const escape = (s) => (s ?? '').replace(/'/g, "''")

for (const d of DRESSES) {
  console.log(`  → ${d.code}`)
  const imgs = []
  for (let i = 0; i < 4; i++) {
    const buf = await nextImage(`${d.code}-${i}`)
    const sized = await sharp(buf).resize(1000, 1400, { fit: 'cover' }).jpeg({ quality: 80, mozjpeg: true }).toBuffer()
    const url = await uploadBuffer(sized, 'dress-images', `${d.code}/img-${i}.jpg`, 'image/jpeg')
    imgs.push(url)
  }
  uploaded.dresses[d.code] = imgs

  const is360 = d.display !== 'images'
  sqlValues.push(`(
    '${d.code}', '${d.code.toLowerCase()}', '${escape(d.name)}', '${escape(d.desc)}',
    (select id from public.categories where slug = '${d.cat}'),
    '${escape(d.design)}', array['${d.sizes.join("','")}']::text[], array['${d.colors.join("','")}']::text[],
    '${escape(d.fabric)}',
    ${d.sale ?? 'null'}, ${d.rent ?? 'null'},
    '${d.avail}', '${d.status}', '${d.display}',
    '${imgs[0]}', ${d.featured}, ${d.discount}, ${DRESSES.indexOf(d)}
  )`)

  // إطارات 360 للفستان المخصص
  if (is360) {
    console.log(`    ↳ uploading ${FRAMES} frames`)
    const frameUrls = []
    for (let i = 0; i < FRAMES; i++) {
      const idx = String(i + 1).padStart(2, '0')
      const url = await uploadBuffer(frameBuffers[i], 'dress-360', `${d.code}/${idx}.webp`, 'image/webp')
      frameUrls.push(url)
    }
    uploaded.dresses[`${d.code}-frames`] = frameUrls
  }
}

/* ============== 5) SQL ============== */
console.log('5) Writing seed SQL...')
let sql = `begin;\n`

// إعادة التشغيل: إزالة البيانات الأولية السابقة (cascade يحذف الصور والإطارات)
const codes = DRESSES.map((d) => `'${d.code}'`).join(', ')
sql += `delete from public.dresses where code in (${codes});\n\n`

sql += `update public.categories set image_url = v.url\nfrom (values\n`
sql += CATS.map((c) => `  ('${c}', '${uploaded.categories[c]}')`).join(',\n')
sql += `\n) as v(slug, url)\nwhere public.categories.slug = v.slug;\n\n`

sql += `update public.business_settings set\n  hero_image = '${uploaded.hero}',\n  showroom_images = array['${uploaded.showroom.join("','")}']::text[]\nwhere id = 1;\n\n`

sql += `insert into public.dresses (\n  code, slug, name_ar, description, category_id, design_type, sizes, colors, fabric,\n  sale_price, rent_price, availability, status, display_mode, cover_image, is_featured, discount_percent, sort_order\n) values\n`
sql += sqlValues.join(',\n')
sql += `\non conflict (code) do nothing;\n\n`

// صور المعرض
for (const d of DRESSES) {
  const urls = uploaded.dresses[d.code]
  sql += `insert into public.dress_images (dress_id, url, alt, sort_order)\n`
  sql += `select id, u.url, '${escape(`فستان ${d.code}`)}', u.ord\n`
  sql += `from public.dresses, (values ${urls.map((u, i) => `('${u}', ${i})`).join(', ')}) as u(url, ord)\n`
  sql += `where public.dresses.code = '${d.code}';\n`
}

// إطارات 360
for (const d of DRESSES.filter((x) => x.display !== 'images')) {
  const urls = uploaded.dresses[`${d.code}-frames`]
  sql += `insert into public.dress_360_frames (dress_id, url, frame_index)\n`
  sql += `select id, u.url, u.ord\n`
  sql += `from public.dresses, (values ${urls.map((u, i) => `('${u}', ${i})`).join(', ')}) as u(url, ord)\n`
  sql += `where public.dresses.code = '${d.code}';\n`
}

sql += `commit;\n`
writeFileSync(path.join(__dirname, '..', 'supabase', '005_seed_generated.sql'), sql)
console.log('  ✓ supabase/005_seed_generated.sql')

console.log('6) Applying seed SQL...')
await runSql(sql)
console.log('\n✅ SEED COMPLETE')
