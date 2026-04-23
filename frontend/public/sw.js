import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'

// Injected by VitePWA at build time — handles asset caching and updates
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// SPA fallback — all navigation requests serve index.html
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('/index.html'))
)

self.skipWaiting()
self.addEventListener('activate', () => self.clients.claim())

// ─── Push Notifications ───────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'PrioritEase', body: event.data.text() }
  }

  const { title, body, icon, badge, url } = payload

  event.waitUntil(
    self.registration.showNotification(title || 'PrioritEase', {
      body:  body  || '',
      icon:  icon  || '/icons/icon-192x192.png',
      badge: badge || '/icons/badge-72x72.png',
      data:  { url: url || '/' },
      // Vibration pattern for mobile: vibrate, pause, vibrate
      vibrate: [100, 50, 100],
    })
  )
})

// ─── Notification Click ───────────────────────────────────────────────────────

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // If the app is already open in a tab, focus it and navigate
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus()
          client.navigate(targetUrl)
          return
        }
      }
      // Otherwise open a new tab
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    })
  )
})