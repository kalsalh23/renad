import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Appointment, BusinessSettings, Category, Dress, Dress360Frame, DressImage, Notification } from '@/lib/types'

/* ---------------- التصنيفات ---------------- */
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .order('sort_order')
      .then(({ data }) => {
        setCategories((data as Category[]) ?? [])
        setLoading(false)
      })
  }, [])

  return { categories, loading }
}

/* ---------------- الفساتين ---------------- */
export function useDresses(options: { featuredOnly?: boolean; activeOnly?: boolean } = {}) {
  const { featuredOnly = false, activeOnly = true } = options
  const [dresses, setDresses] = useState<Dress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let query = supabase
      .from('dresses')
      .select('*, category:categories(id, slug, name_ar, name_en)')
      .order('sort_order')
      .order('created_at', { ascending: false })
    if (featuredOnly) query = query.eq('is_featured', true)
    if (activeOnly) query = query.eq('is_active', true)
    query.then(({ data }) => {
      setDresses((data as unknown as Dress[]) ?? [])
      setLoading(false)
    })
  }, [featuredOnly, activeOnly])

  return { dresses, loading }
}

export function useDressBySlug(slug: string | undefined) {
  const [dress, setDress] = useState<Dress | null>(null)
  const [images, setImages] = useState<DressImage[]>([])
  const [frames, setFrames] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setNotFound(false)
    ;(async () => {
      const { data, error } = await supabase
        .from('dresses')
        .select('*, category:categories(id, slug, name_ar, name_en)')
        .eq('slug', slug)
        .maybeSingle()
      if (error || !data) {
        setNotFound(true)
        setLoading(false)
        return
      }
      const dressRow = data as unknown as Dress
      setDress(dressRow)
      const [imgRes, frameRes] = await Promise.all([
        supabase.from('dress_images').select('*').eq('dress_id', dressRow.id).order('sort_order'),
        supabase
          .from('dress_360_frames')
          .select('url, frame_index')
          .eq('dress_id', dressRow.id)
          .order('frame_index'),
      ])
      setImages((imgRes.data as DressImage[]) ?? [])
      setFrames(((frameRes.data as Dress360Frame[]) ?? []).map((f) => f.url))
      setLoading(false)
    })()
  }, [slug])

  return { dress, images, frames, loading, notFound }
}

export function useRelatedDresses(dress: Dress | null, count = 4) {
  const [related, setRelated] = useState<Dress[]>([])
  useEffect(() => {
    if (!dress?.category_id) {
      setRelated([])
      return
    }
    supabase
      .from('dresses')
      .select('*, category:categories(id, slug, name_ar, name_en)')
      .eq('is_active', true)
      .eq('category_id', dress.category_id)
      .neq('id', dress.id)
      .limit(count)
      .then(({ data }) => setRelated((data as unknown as Dress[]) ?? []))
  }, [dress, count])
  return related
}

/* ---------------- المواعيد ---------------- */
export function useAppointments(filter?: { userField?: 'user_id'; userValue?: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    let query = supabase
      .from('appointments')
      .select('*, dress:dresses(code, name_ar, slug, cover_image)')
      .order('appointment_date', { ascending: false })
      .order('appointment_time')
    if (filter?.userField && filter.userValue) {
      query = query.eq(filter.userField, filter.userValue)
    }
    const { data } = await query
    setAppointments((data as unknown as Appointment[]) ?? [])
    setLoading(false)
  }, [filter?.userField, filter?.userValue])

  useEffect(() => {
    load()
  }, [load])

  return { appointments, loading, reload: load }
}

/* ---------------- الإشعارات ---------------- */
export function useNotifications(audience: 'admin' | 'customer', userId?: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)

  const load = useCallback(async () => {
    let query = supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50)
    if (audience === 'admin') {
      query = query.eq('audience', 'admin')
    } else if (userId) {
      query = query.eq('audience', 'customer').eq('user_id', userId)
    } else {
      setNotifications([])
      setUnread(0)
      return
    }
    const { data } = await query
    const rows = (data as Notification[]) ?? []
    setNotifications(rows)
    setUnread(rows.filter((n) => !n.is_read).length)
  }, [audience, userId])

  useEffect(() => {
    load()
    const t = setInterval(load, 30_000)
    return () => clearInterval(t)
  }, [load])

  const markRead = useCallback(
    async (id: string) => {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id)
      load()
    },
    [load],
  )

  const markAllRead = useCallback(async () => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('audience', audience)
      .eq('is_read', false)
    load()
  }, [audience, load])

  return { notifications, unread, markRead, markAllRead, reload: load }
}

/* ---------------- الإعدادات العامة (نسخة كاملة للوحة التحكم) ---------------- */
export function useBusinessSettingsFull() {
  const [settings, setSettings] = useState<BusinessSettings | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase.from('business_settings').select('*').eq('id', 1).maybeSingle()
    setSettings((data as BusinessSettings) ?? null)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { settings, loading, reload: load }
}
