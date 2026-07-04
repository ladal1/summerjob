self.addEventListener('push', function (event) {
  const data = event.data ? event.data.json() : {}

  const options = {
    body: data.body,
    icon: '/icon-256x256.png',
    badge: '/icon-96x96.png',
    vibrate: [100, 50, 100],
    requireInteraction: true,
    data: {
      url: data.url || '/notifications',
      dateOfArrival: Date.now(),
    },
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'SummerJob', options)
  )
})

self.addEventListener('notificationclick', function (event) {
  event.waitUntil(clients.openWindow(event.notification.data.url))
})
