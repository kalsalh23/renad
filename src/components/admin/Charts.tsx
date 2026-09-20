import { cn } from '@/lib/utils'

/* ---------------- بطاقة إحصائية ---------------- */
export function StatCard({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string
  value: number | string
  hint?: string
  tone?: 'default' | 'gold' | 'green' | 'red' | 'blue'
}) {
  const tones: Record<string, string> = {
    default: 'text-ink',
    gold: 'text-gold-dark',
    green: 'text-emerald-600',
    red: 'text-rose-600',
    blue: 'text-sky-600',
  }
  return (
    <div className="card p-5">
      <p className="text-xs text-smoke">{label}</p>
      <p className={cn('mt-2 font-display text-3xl', tones[tone])}>{value}</p>
      {hint && <p className="mt-1 text-[11px] text-beige">{hint}</p>}
    </div>
  )
}

/* ---------------- مخطط أعمدة بسيط ---------------- */
export function BarChart({ data, labels }: { data: number[]; labels: string[] }) {
  const max = Math.max(...data, 1)
  return (
    <div className="flex h-40 items-end justify-between gap-2 pt-4">
      {data.map((v, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-2">
          <span className="text-[10px] font-bold text-smoke">{v || ''}</span>
          <div
            className="w-full max-w-8 rounded-t-sm bg-gradient-to-t from-gold-dark to-gold transition-all"
            style={{ height: `${Math.max((v / max) * 100, v > 0 ? 6 : 2)}%` }}
            title={`${labels[i]}: ${v}`}
          />
          <span className="text-[9px] text-beige">{labels[i]}</span>
        </div>
      ))}
    </div>
  )
}

/* ---------------- مخطط دائري (Donut) ---------------- */
export function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0)
  const R = 15.915
  let offset = 25 // نقطة البداية من الأعلى

  return (
    <div className="flex items-center gap-6">
      <div className="relative h-36 w-36 shrink-0">
        <svg viewBox="0 0 42 42" className="h-full w-full -scale-x-100">
          <circle cx="21" cy="21" r={R} fill="none" stroke="#F4EEE2" strokeWidth="5" />
          {total > 0 &&
            segments.map((s) => {
              const pct = (s.value / total) * 100
              const el = (
                <circle
                  key={s.label}
                  cx="21"
                  cy="21"
                  r={R}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="5"
                  strokeDasharray={`${pct} ${100 - pct}`}
                  strokeDashoffset={offset}
                />
              )
              offset -= pct
              return el
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl">{total}</span>
          <span className="text-[10px] text-beige">إجمالي</span>
        </div>
      </div>
      <ul className="space-y-2 text-xs">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            <span className="text-smoke">{s.label}</span>
            <span className="font-bold text-ink">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
