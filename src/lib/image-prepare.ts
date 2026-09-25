/**
 * معالجة الصور قبل الرفع:
 * - الصور الأكبر من 1.6MB تُضغط تلقائيًا في المتصفح (canvas) إلى حد ~1.5MB
 * - صيغ غير مدعومة من المتصفح (مثل HEIC على بعض الأجهزة) تُحوَّل إلى JPEG عند الإمكان
 * - صور WebGL/فائقة الدقة تفشل أحيانًا في الرفع المباشر — الضغط يحل ذلك
 */

const TARGET_MAX_BYTES = 1.5 * 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export interface PreparedImage {
  blob: Blob
  type: string
  name: string
  originalSize: number
  compressed: boolean
}

async function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), type, quality))
}

/** يعيد صورة جاهزة للرفع (الملف الأصلي إن كان صغيرًا، أو نسخة مضغوطة) */
export async function prepareImageForUpload(file: File): Promise<PreparedImage> {
  const base: PreparedImage = {
    blob: file,
    type: file.type || 'image/jpeg',
    name: file.name || 'image.jpg',
    originalSize: file.size,
    compressed: false,
  }

  if (file.size <= TARGET_MAX_BYTES && ALLOWED.includes(file.type)) {
    return base
  }

  // تحميل إلى عنصر img ثم الرسم على canvas بأبعاد مخففة
  try {
    const bitmapUrl = URL.createObjectURL(file)
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('cannot decode image (possibly unsupported format like HEIC)'))
      el.src = bitmapUrl
    })

    const maxSide = 1800
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight))
    const w = Math.max(1, Math.round(img.naturalWidth * scale))
    const h = Math.max(1, Math.round(img.naturalHeight * scale))

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('canvas unavailable')
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, 0, 0, w, h)
    URL.revokeObjectURL(bitmapUrl)

    // ضغط تدريجي حتى الوصول للحجم المستهدف
    let quality = 0.85
    let blob = await canvasToBlob(canvas, 'image/jpeg', quality)
    while (blob && blob.size > TARGET_MAX_BYTES && quality > 0.4) {
      quality -= 0.15
      blob = await canvasToBlob(canvas, 'image/jpeg', quality)
    }
    if (!blob || blob.size === 0) throw new Error('compression failed')

    return {
      blob,
      type: 'image/jpeg',
      name: (base.name.replace(/\.[^.]+$/, '') || 'image') + '.jpg',
      originalSize: file.size,
      compressed: true,
    }
  } catch (e) {
    // إن تعذّرت المعالجة نعيد الملف الأصلي وسيقرأه التحقق لاحقًا
    return base
  }
}
