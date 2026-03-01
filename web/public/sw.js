self.addEventListener('push', function (event) {
  const data = event.data ? event.data.json() : {}

  const options = {
    body: data.body,
    // icon: '/favicon.ico',
    // badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    requireInteraction: true,
    data: {
      url: data.url || '/',
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
