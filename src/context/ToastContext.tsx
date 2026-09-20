import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'info'
interface ToastItem {
  id: number
  type: ToastType
  message: string
}

const ToastContext = createContext<{ toast: (type: ToastType, message: string) => void }>({
  toast: () => {},
})

let counter = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const toast = useCallback((type: ToastType, message: string) => {
    const id = ++counter
    setItems((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id))
    }, 4200)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 left-1/2 z-[100] flex w-[92vw] max-w-sm -translate-x-1/2 flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className={`animate-slide-down rounded-sm border px-4 py-3 text-sm shadow-lg backdrop-blur ${
              t.type === 'success'
                ? 'border-emerald-200 bg-emerald-50/95 text-emerald-800'
                : t.type === 'error'
                  ? 'border-rose-200 bg-rose-50/95 text-rose-700'
                  : 'border-champagne bg-ivory/95 text-ink'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
