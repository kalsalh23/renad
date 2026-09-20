import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './AuthContext'

const LOCAL_KEY = 'renad_favorites'

interface FavoritesContextValue {
  ids: string[]
  isFavorite: (dressId: string) => boolean
  toggleFavorite: (dressId: string) => Promise<void>
  loading: boolean
}

const FavoritesContext = createContext<FavoritesContextValue>({
  ids: [],
  isFavorite: () => false,
  toggleFavorite: async () => {},
  loading: false,
})

function readLocal(): string[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

function writeLocal(ids: string[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(ids))
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [ids, setIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  // تحميل المفضلة: من قاعدة البيانات عند تسجيل الدخول (مع دمج المحلية)، وإلا من الجهاز
  useEffect(() => {
    let cancelled = false
    if (user) {
      setLoading(true)
      ;(async () => {
        const local = readLocal()
        const { data } = await supabase.from('favorites').select('dress_id').eq('user_id', user.id)
        const remote = (data ?? []).map((r) => r.dress_id as string)
        // دمج المفضلة المحلية مع حساب العميلة
        const missing = local.filter((id) => !remote.includes(id))
        if (missing.length) {
          await supabase.from('favorites').insert(missing.map((dress_id) => ({ user_id: user.id, dress_id })))
        }
        if (!cancelled) {
          setIds([...remote, ...missing])
          writeLocal([...remote, ...missing])
          setLoading(false)
        }
      })()
    } else {
      setIds(readLocal())
      setLoading(false)
    }
    return () => {
      cancelled = true
    }
  }, [user])

  const toggleFavorite = useCallback(
    async (dressId: string) => {
      const isFav = ids.includes(dressId)
      const next = isFav ? ids.filter((id) => id !== dressId) : [...ids, dressId]
      setIds(next) // Optimistic UI
      if (user) {
        if (isFav) {
          await supabase.from('favorites').delete().eq('user_id', user.id).eq('dress_id', dressId)
        } else {
          await supabase.from('favorites').upsert({ user_id: user.id, dress_id: dressId })
        }
      }
      writeLocal(next)
    },
    [ids, user],
  )

  return (
    <FavoritesContext.Provider
      value={{
        ids,
        isFavorite: (dressId) => ids.includes(dressId),
        toggleFavorite,
        loading,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  return useContext(FavoritesContext)
}
