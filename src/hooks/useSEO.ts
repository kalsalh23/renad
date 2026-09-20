import { useEffect } from 'react'

export interface SEOOptions {
  title?: string
  description?: string
  image?: string
  type?: string
}

/**
 * يحدّث عنوان الصفحة ووسوم الميتا ديناميكيًا (SEO + Open Graph)
 */
export function useSEO({ title, description, image, type = 'website' }: SEOOptions) {
  const fullTitle = title ? `${title} | ريناد` : 'ريناد | RENAD — فساتين الأعراس للإيجار والشراء'

  useEffect(() => {
    document.title = fullTitle

    const setMeta = (attr: 'name' | 'property', key: string, content: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, key)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    if (description) setMeta('name', 'description', description)
    setMeta('property', 'og:title', fullTitle)
    if (description) setMeta('property', 'og:description', description)
    setMeta('property', 'og:type', type)
    setMeta('property', 'og:url', window.location.href)
    if (image) setMeta('property', 'og:image', image)
  }, [fullTitle, description, image, type])
}
