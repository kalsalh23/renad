/** رفع الصور إلى Supabase Storage (تُستخدم في لوحة التحكم) */
import { supabase } from '@/lib/supabase'
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_MB } from '@/lib/constants'
import { sanitizeFileName } from '@/lib/utils'

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

  const safe = sanitizeFileName(file.name)
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${safe}`
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  })
  if (error) return { ok: false, error: error.message }
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return { ok: true, url: data.publicUrl }
}

/** ترتيب طبيعي لأسماء إطارات الـ360 (img2 قبل img10) */
export function sortFrameFiles(files: File[]): File[] {
  return [...files].sort((a, b) =>
    a.name.localeCompare(b.name, 'en', { numeric: true, sensitivity: 'base' }),
  )
}
