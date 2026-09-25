/* ريناد — Service Worker: وضع التطبيق وذاكرة مؤقتة خفيفة */
const VERSION = 'renad-v1'
const CORE = ['/', '/index.html', '/manifest.json', '/favicon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((c) => c.addAll(CORE))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  // لا نلمس الـAPI أو التخزين أو المصادر الخارجية
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return

  // التنقل بين الصفحات: شبكة أولًا مع نسخة احتياطية عند انقطاع الإنترنت
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const copy = res.clone()
          caches.open(VERSION).then((c) => c.put('/index.html', copy))
          return res
        })
        .catch(() => caches.match('/index.html'))
    )
    return
  }

  // الأصول المبنية (مرقمة بأسماء هاش): ذاكرة أولًا
  if (url.pathname.startsWith('/assets/') || url.pathname === '/favicon.svg' || url.pathname === '/manifest.json') {
    event.respondWith(
      caches.match(event.request).then(
        (hit) =>
          hit ||
          fetch(event.request).then((res) => {
            const copy = res.clone()
            caches.open(VERSION).then((c) => c.put(event.request, copy))
            return res
          })
      )
    )
  }
})
