import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'

export function Spinner({ className = '' }: { className?: string }) {
  return <Loader2 className={`h-5 w-5 animate-spin text-gold-dark ${className}`} />
}

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton aspect-[3/4] w-full" />
      <div className="space-y-2 p-4">
        <div className="skeleton h-3 w-1/3" />
        <div className="skeleton h-4 w-2/3" />
        <div className="skeleton h-3 w-1/2" />
      </div>
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  subtitle,
  action,
}: {
  icon?: ReactNode
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      {icon && <div className="text-gold-dark/70">{icon}</div>}
      <h3 className="font-display text-2xl text-ink">{title}</h3>
      {subtitle && <p className="max-w-md text-sm leading-7 text-smoke">{subtitle}</p>}
      {action}
    </div>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'center',
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  align?: 'center' | 'start'
}) {
  return (
    <div className={align === 'center' ? 'text-center' : 'text-start'}>
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h2 className="heading-display text-balance">{title}</h2>
      <div className={`gold-divider ${align === 'start' ? 'ms-0' : ''}`}>
        <span className="inline-block h-1.5 w-1.5 rotate-45 bg-gold" />
      </div>
      {subtitle && <p className="mx-auto mt-2 max-w-2xl text-sm leading-7 text-smoke sm:text-base">{subtitle}</p>}
    </div>
  )
}
