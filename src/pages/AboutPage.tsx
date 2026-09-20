import { Link } from 'react-router-dom'
import { Gem, HeartHandshake, Sparkles, Users } from 'lucide-react'
import { useSettings } from '@/context/SettingsContext'
import { useSEO } from '@/hooks/useSEO'
import { useReveal } from '@/hooks/useReveal'

export default function AboutPage() {
  const { settings } = useSettings()
  const ref = useReveal<HTMLDivElement>()
  useSEO({
    title: 'من نحن',
    description: 'قصة معرض ريناد لفساتين الأعراس — رؤيتنا ورسالتنا وشغفنا بتفاصيل إطلالتكِ.',
  })

  const pillars = [
    { icon: Gem, title: 'جودة الفساتين', body: 'نختار كل فستان بأقمشة فاخرة وتطريز متقن، ونعتمد فقط التصاميم التي نرتاح لتمثيل اسم ريناد.' },
    { icon: Sparkles, title: 'تشكيلة مختارة', body: 'تنوّع مدروس بين الكلاسيكي والعصري، للإيجار والشراء، لتناسب كل عروس وأسلوبها.' },
    { icon: HeartHandshake, title: 'خدمة العميلات', body: 'استشارة شخصية في جلسة خاصة، ومتابعة كاملة من أول محادثة حتى يوم العمر.' },
    { icon: Users, title: 'خصوصية وراحة', body: 'مواعيد خاصة دون ازدحام، لتعيشي تجربة اختيار فستانكِ بأقصى هدوء وخصوصية.' },
  ]

  return (
    <div ref={ref} className="pb-20">
      {/* الغلاف */}
      <div className="relative flex min-h-[40vh] items-center justify-center overflow-hidden bg-ink py-24">
        {settings.about_image && (
          <img src={settings.about_image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-ink/70 to-ink/40" />
        <div className="relative z-10 px-6 text-center">
          <p className="eyebrow !text-gold-light">OUR STORY</p>
          <h1 className="mt-3 font-display text-4xl text-white lg:text-5xl">{settings.about_title || 'قصة ريناد'}</h1>
        </div>
      </div>

      <div className="container-site">
        {/* القصة */}
        <div className="mx-auto mt-14 max-w-3xl text-center">
          <p className="text-base leading-9 text-smoke sm:text-lg">
            {settings.about_body ||
              'بدأت ريناد من فكرة بسيطة: أن تجربة اختيار فستان الزفاف تستحق أن تكون لحظة لا تُنسى بقدر يوم العمر نفسه. اليوم، يقدم ريناد تشكيلة منتقاة من فساتين الأعراس للإيجار والشراء، مع تجربة رقمية تتيح لكِ اكتشاف كل تفصيلة قبل أن تصلي إلينا — ثم جلسة تجربة خاصة ترافقكِ فيها حتى تختاري بثقة وقلب مطمئن.'}
          </p>
        </div>

        {/* الرؤية والرسالة */}
        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:gap-6">
          <div className="card p-8">
            <p className="eyebrow">VISION</p>
            <h2 className="mt-2 font-display text-2xl">رؤيتنا</h2>
            <p className="mt-3 text-sm leading-8 text-smoke">
              {settings.about_vision || 'أن نكون الوجهة الأولى لكل عروس تبحث عن إطلالة استثنائية وتجربة اختيار راقية من البداية للنهاية.'}
            </p>
          </div>
          <div className="card p-8">
            <p className="eyebrow">MISSION</p>
            <h2 className="mt-2 font-display text-2xl">رسالتنا</h2>
            <p className="mt-3 text-sm leading-8 text-smoke">
              {settings.about_mission || 'أن نُقرّب الفستان المناسب من كل عروس — عبر تشكيلة صادقة، وأسعار واضحة، وتقنية تجعل الاكتشاف ممتعًا، وخدمة تحفظ خصوصيتها.'}
            </p>
          </div>
        </div>

        {/* الركائز */}
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {pillars.map((p) => (
            <div key={p.title} className="card p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-champagne bg-cream text-gold-dark">
                <p.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg">{p.title}</h3>
              <p className="mt-2 text-[13px] leading-7 text-smoke">{p.body}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Link to="/book" className="btn-gold px-10">احجزي موعد تجربة</Link>
        </div>
      </div>
    </div>
  )
}
