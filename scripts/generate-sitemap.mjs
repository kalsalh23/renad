/**
 * يولّد sitemap.xml عند البناء — يشمل الصفحات الثابتة + كل فستان نشط
 */
import { writeFileSync } from 'node:fs'

const SITE = process.env.VITE_SITE_URL || 'http://localhost:5173'
const SUPA_URL = process.env.VITE_SUPABASE_URL
const SUPA_KEY = process.env.VITE_SUPABASE_ANON_KEY

const staticPages = ['', '/dresses', '/rent', '/buy', '/about', '/contact', '/book', '/favorites']

let dressUrls = []
try {
  if (SUPA_URL && SUPA_KEY) {
    const res = await fetch(
      `${SUPA_URL}/rest/v1/dresses?select=slug,updated_at&is_active=eq.true`,
      { headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` } },
    )
    if (res.ok) {
      const rows = await res.json()
      dressUrls = rows.map((r) => `/dresses/${r.slug}`)
    }
  }
} catch {
  // تجاهل — الـ sitemap الثابت يبقى صالحًا
}

const urls = [...staticPages, ...dressUrls]
const today = new Date().toISOString().slice(0, 10)
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (p) => `  <url>
    <loc>${SITE}${p}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p === '' ? 'daily' : 'weekly'}</changefreq>
    <priority>${p === '' ? '1.0' : '0.8'}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`

writeFileSync('dist/sitemap.xml', xml)
console.log(`sitemap.xml: ${urls.length} URLs`)
