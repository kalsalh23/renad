/** رفع الصور إلى Supabase Storage (تُستخدم في لوحة التحكم) */
import { supabase } from '@/lib/supabase'
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_MB } from '@/lib/constants'
import { sanitizeFileName } from '@/lib/utils'
import { prepareImageForUpload } from './image-prepare'

export interface UploadResult {
  ok: boolean
  url?: string
  error?: string
}

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return `نوع الملف غير مدعوم: ${file.name} (المسموح: JPG, PNG, WebP)`
  }
  if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
    return `حجم الملف كبير (${file.name}) — الحد الأقصى ${MAX_IMAGE_SIZE_MB}MB`
  }
  return null
}

export async function uploadImage(
  file: File,
  bucket: string,
  folder: string,
): Promise<UploadResult> {
  const invalid = validateImageFile(file)
  if (invalid) return { ok: false, error: invalid }

  // ضغط تلقائي للصور الكبيرة قبل الرفع — يعالج فشل الرفع المتقطع
  const prepared = await prepareImageForUpload(file)
  const finalType = ALLOWED_IMAGE_TYPES.includes(prepared.type) ? prepared.type : 'image/jpeg'

  const safe = sanitizeFileName(prepared.name)
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${safe}`

  // محاولتا رفع — فشل الشبكة المؤقت شائع مع الملفات الكبيرة
  let error: { message: string } | null = null
  for (let attempt = 1; attempt <= 2; attempt++) {
    const res = await supabase.storage.from(bucket).upload(path, prepared.blob, {
      cacheControl: '3600',
      upsert: attempt === 2, // المحاولة الثانية تعيد كتابة نفس المسار إن كان الأول رفعه جزئيًا
      contentType: finalType,
    })
    error = res.error as { message: string } | null
    if (!error) break
    if (!error.message.includes('Failed to fetch') && !error.message.includes('NetworkError')) break
    await new Promise((r) => setTimeout(r, 1200))
  }

  if (error) {
    // رسائل عربية واضحة حسب نوع الخطأ
    if (error.message.includes('Payload too large') || error.message.includes('413')) {
      return { ok: false, error: 'حجم الصورة كبير جدًا حتى بعد الضغط — جرّبي صورة أصغر.' }
    }
    if (error.message.includes('mime') || error.message.includes('type')) {
      return { ok: false, error: `صيغة غير مدعومة (${file.type || 'غير معروفة'}) — المسموح: JPG, PNG, WebP.` }
    }
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      return { ok: false, error: 'انقطع الاتصال أثناء الرفع — تحققي من الإنترنت وأعيدي المحاولة.' }
    }
    return { ok: false, error: 'فشل الرفع: ' + error.message }
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return { ok: true, url: data.publicUrl }
}
