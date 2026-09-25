import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface PointsState {
  balance: number
  loading: boolean
}

/** رصيد نقاط الولاء للعميلة الحالية */
export function usePointsBalance(userId?: string | null): PointsState {
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!userId) {
      setBalance(0)
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from('loyalty_points')
      .select('points')
      .eq('user_id', userId)
      .maybeSingle()
    setBalance((data as { points: number } | null)?.points ?? 0)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    load()
    // تحديث دوري خفيف — الرصيد قد يتغير من الإدارة
    const t = setInterval(load, 60_000)
    return () => clearInterval(t)
  }, [load])

  return { balance, loading }
}

export const POINTS_PER_DRESS = 100
export const POINTS_REWARD_TEXT = '100 نقطة لكل فستان — استبدليها بخصم في المعرض أو فستان مجاني'
