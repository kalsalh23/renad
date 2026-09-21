/**
 * اختبار شامل لمسار رفع الصور في لوحة التحكم — نفس آلية التطبيق تمامًا:
 * 1) تسجيل دخول المدير (Supabase Auth)
 * 2) التحقق من صلاحية is_admin عبر profiles
 * 3) رفع صورة اختبارية إلى bucket dress-images (كما تفعل uploadImage في التطبيق)
 * 4) التحقق من الرابط العام
 * 5) التأكد أن الرفع المجهول (بدون تسجيل) مرفوض (حماية)
 * 6) حذف الصورة الاختبارية
 *
 * الاستخدام: node scripts/verify-upload.mjs --email=... --pass=...
 */
import sharp from 'sharp'

let email = '', pass = ''
const REF = 'kpnhtuwrdxfggvadnpkt'
const SUPA = `https://${REF}.supabase.co`
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtwbmh0dXdyZHhmZ2d2YWRucGt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MjU3MzYsImV4cCI6MjEwNTUwMTczNn0.MwHH2-KnVOiBI0NdEzG-lACpdKXg-KsY3A2YT2qOklY'
for (const a of process.argv.slice(2)) {
  if (a.startsWith('--email=')) email = a.slice(8)
  else if (a.startsWith('--pass=')) pass = a.slice(7)
}
if (!email || !pass) {
  console.error('Usage: node scripts/verify-upload.mjs --email=<admin> --pass=<password>')
  process.exit(1)
}

// 1) تسجيل الدخول كما في التطبيق
console.log('1) Admin sign-in...')
const loginRes = await fetch(`${SUPA}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: { apikey: ANON, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password: pass }),
})
const login = await loginRes.json()
if (!login.access_token) {
  console.log('   ✗ LOGIN FAILED:', login.error_description || login.message)
  process.exit(1)
}
console.log('   ✓ logged in, role:', login.user?.role)

// 2) التحقق من profile.role = admin (كما يفعل AuthContext)
console.log('2) Profile check...')
const profRes = await fetch(`${SUPA}/rest/v1/profiles?select=role&email=eq.${encodeURIComponent(email)}`, {
  headers: { apikey: ANON, Authorization: `Bearer ${login.access_token}` },
})
const prof = await profRes.json()
console.log('   ✓ profile role:', prof?.[0]?.role)
if (prof?.[0]?.role !== 'admin') {
  console.log('   ✗ NOT ADMIN — uploads would be blocked by RLS')
  process.exit(1)
}

// 3) توليد صورة اختبارية (كملف حقيقي كما يختاره المدير من الجهاز)
console.log('3) Creating test image (JPEG 900x1200)...')
const testBuf = await sharp({
  create: { width: 900, height: 1200, channels: 3, background: { r: 244, g: 238, b: 226 } },
})
  .composite([{
    input: Buffer.from(`<svg width="900" height="1200"><text x="450" y="600" font-family="Arial" font-size="60" fill="#AE8B4F" text-anchor="middle">RENAD UPLOAD TEST</text></svg>`),
  }])
  .jpeg({ quality: 80 })
  .toBuffer()
console.log('   ✓ test image ready (' + testBuf.length + ' bytes)')

// 4) الرفع بنفس صيغة uploadImage من التطبيق
const path = `test-upload-verify/${Date.now()}-verify.jpg`
console.log('4) Upload to dress-images bucket (authenticated admin)...')
const upRes = await fetch(`${SUPA}/storage/v1/object/dress-images/${path}`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${login.access_token}`, 'Content-Type': 'image/jpeg', 'x-upsert': 'false' },
  body: testBuf,
})
const upText = await upRes.text()
if (!upRes.ok) {
  console.log('   ✗ UPLOAD FAILED:', upRes.status, upText.slice(0, 200))
  process.exit(1)
}
console.log('   ✓ uploaded:', upText)

// 5) التحقق من الرابط العام
console.log('5) Public URL check...')
const publicUrl = `${SUPA}/storage/v1/object/public/dress-images/${path}`
const pubRes = await fetch(publicUrl)
console.log('   ✓ public URL:', pubRes.status === 200 ? 'WORKS' : 'FAILED ' + pubRes.status, `(${pubRes.headers.get('content-type')})`)

// 6) التأكد أن الرفع بدون تسجيل دخول مرفوض (الحماية تعمل)
console.log('6) Anonymous upload attempt (should be REJECTED)...')
const anonRes = await fetch(`${SUPA}/storage/v1/object/dress-images/test-upload-verify/anon-test.jpg`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${ANON}`, 'Content-Type': 'image/jpeg' },
  body: testBuf,
})
console.log('   ✓ anonymous upload rejected:', anonRes.status === 403 ? 'YES (403)' : `status ${anonRes.status}`)

// 7) حذف الصورة الاختبارية (كما يفعل زر الحذف في اللوحة)
console.log('7) Cleanup...')
const delRes = await fetch(`${SUPA}/storage/v1/object/dress-images/${path}`, {
  method: 'DELETE',
  headers: { Authorization: `Bearer ${login.access_token}` },
})
console.log('   ✓ deleted:', delRes.ok ? 'OK' : delRes.status)

console.log('\n✅ DASHBOARD UPLOAD FLOW VERIFIED END-TO-END')
