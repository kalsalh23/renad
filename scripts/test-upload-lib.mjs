/**
 * اختبار مسار رفع الصور بمكتبة supabase-js نفسها (نفس كود اللوحة)
 * يختبر: رفع صورة الهيرو + صورة فستان + حفظ الإعدادات + حذف الاختبارات
 */
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

const REF = 'kpnhtuwrdxfggvadnpkt'
const SUPA_URL = `https://${REF}.supabase.co`
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtwbmh0dXdyZHhmZ2d2YWRucGt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MjU3MzYsImV4cCI6MjEwNTUwMTczNn0.MwHH2-KnVOiBI0NdEzG-lACpdKXg-KsY3A2YT2qOklY'
const EMAIL = 'admin@renad.app'
const PASS = 'Renad-yk7x9iYAYX!26'

const supabase = createClient(SUPA_URL, ANON, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
})

// 1) دخول المدير
console.log('1) signInWithPassword...')
const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({ email: EMAIL, password: PASS })
if (authErr) {
  console.log('   ✗', authErr.message)
  process.exit(1)
}
console.log('   ✓ session ok, user:', auth.user.email)

// 2) قراءة profile كما يفعل AuthContext
console.log('2) profile...')
const { data: prof, error: profErr } = await supabase.from('profiles').select('role').eq('id', auth.user.id).maybeSingle()
console.log('   ✓ role =', prof?.role, profErr ? `err:${profErr.message}` : '')

// 3) ملف اختباري
console.log('3) building test jpeg...')
const tinySvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"><rect width="600" height="800" fill="#F4EEE2"/><text x="300" y="400" font-family="Arial" font-size="40" fill="#AE8B4F" text-anchor="middle">TEST</text></svg>`)
const fileBuf = await sharp(tinySvg).jpeg({ quality: 80 }).toBuffer()
// نحاكي File كما في المتصفح
const testFile = new File([fileBuf], 'hero-test.jpg', { type: 'image/jpeg' })
console.log('   ✓ file built:', testFile.size, 'bytes, type:', testFile.type)

// 4) رفع صورة الهيرو — نفس استدعاء uploadImage في اللوحة
console.log('4) upload hero-images/hero/ ...')
const heroPath = `hero/${Date.now()}-abc12-hero-test.jpg`
const { data: heroUp, error: heroErr } = await supabase.storage
  .from('hero-images')
  .upload(heroPath, testFile, { cacheControl: '3600', upsert: false, contentType: 'image/jpeg' })
if (heroErr) console.log('   ✗ HERO UPLOAD FAILED:', heroErr.message, heroErr.status ?? '')
else console.log('   ✓ uploaded:', heroUp?.path)

// 5) رفع صورة فستان
console.log('5) upload dress-images/pending/ ...')
const { data: drUp, error: drErr } = await supabase.storage
  .from('dress-images')
  .upload(`pending/test-${Date.now()}.jpg`, testFile, { cacheControl: '3600', upsert: false, contentType: 'image/jpeg' })
if (drErr) console.log('   ✗ DRESS UPLOAD FAILED:', drErr.message, drErr.status ?? '')
else console.log('   ✓ uploaded:', drUp?.path)

// 6) تحديث business_settings (زر الحفظ في صفحة الإعدادات)
console.log('6) update business_settings (save hero_image)...')
const { data: cur } = await supabase.from('business_settings').select('hero_image').eq('id', 1).maybeSingle()
const testHeroUrl = heroErr ? null : `${SUPA_URL}/storage/v1/object/public/hero-images/${heroPath}`
const { error: updErr } = await supabase
  .from('business_settings')
  .update({ hero_image: testHeroUrl ?? cur?.hero_image })
  .eq('id', 1)
console.log('   ✓ settings update:', updErr ? '✗ ' + updErr.message : 'OK')
if (!updErr && testHeroUrl) {
  const { data: after } = await supabase.from('business_settings').select('hero_image').eq('id', 1).maybeSingle()
  console.log('   ✓ hero_image in DB now =', after?.hero_image)
}

// 7) تنظيف: إرجاع الهيرو السابق وحذف الملفات الاختبارية
console.log('7) cleanup...')
if (heroUp && cur?.hero_image) {
  await supabase.from('business_settings').update({ hero_image: cur.hero_image }).eq('id', 1)
  console.log('   ✓ hero_image restored to', cur.hero_image.slice(0, 60) + '...')
}
if (heroUp) await supabase.storage.from('hero-images').remove([heroPath])
if (drUp) await supabase.storage.from('dress-images').remove([drUp.path])
console.log('   ✓ test files removed')

console.log('\nDONE')
