import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!supabaseUrl || !supabaseAnonKey) {
  // نعرض رسالة واضحة بدل انهيار صامت عند فقدان متغيرات البيئة
  console.error('يرجى تعريف VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY في ملف .env')
}

export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'public-anon-key-placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'renad-auth',
    },
  },
)

export const SUPABASE_URL = supabaseUrl ?? 'https://placeholder.supabase.co'

export const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined) ?? window.location.origin
