/**
 * أداة تطبيق ملفات SQL على مشروع Supabase عبر Management API
 * الاستخدام: node scripts/db.mjs <file.sql> [file2.sql ...]
 * يتطلب: SUPABASE_ACCESS_TOKEN و SUPABASE_REF في متغيرات البيئة أو كوسائط
 */
import { readFileSync } from 'node:fs'

const args = process.argv.slice(2)
let token = process.env.SUPABASE_ACCESS_TOKEN
let ref = process.env.SUPABASE_REF
const files = []

for (const a of args) {
  if (a.startsWith('--token=')) token = a.slice(8)
  else if (a.startsWith('--ref=')) ref = a.slice(6)
  else files.push(a)
}

if (!token || !ref) {
  console.error('Usage: node scripts/db.mjs --token=<sbp_...> --ref=<project-ref> <file.sql>')
  process.exit(1)
}

for (const file of files) {
  const sql = readFileSync(file, 'utf8')
  process.stdout.write(`Applying ${file} ... `)
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  })
  const text = await res.text()
  if (!res.ok) {
    console.log('FAILED')
    console.error(text.slice(0, 3000))
    process.exit(1)
  }
  console.log('OK')
  if (text && text !== '[]') console.log(text.slice(0, 800))
}
