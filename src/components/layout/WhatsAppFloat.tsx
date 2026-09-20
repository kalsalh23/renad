import { MessageCircle } from 'lucide-react'
import { useSettings } from '@/context/SettingsContext'
import { waLink } from '@/lib/utils'

export function WhatsAppFloat() {
  const { settings } = useSettings()
  if (!settings.whatsapp_number) return null

  return (
    <a
      href={waLink(settings.whatsapp_number, 'مرحبًا، أود الاستفسار عن فساتين ريناد.')}
      target="_blank"
      rel="noreferrer"
      aria-label="تواصلي معنا عبر واتساب"
      className="fixed bottom-20 left-4 z-40 flex h-13 w-13 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-emerald-900/20 transition-transform hover:scale-105 md:bottom-6 md:left-6"
      style={{ width: 52, height: 52 }}
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  )
}
