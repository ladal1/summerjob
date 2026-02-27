self.addEventListener('push', function (event) {
  const data = event.data ? event.data.json() : {}

  const options = {
    body: data.body,
    // icon: '/favicon.ico',
    // badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    requireInteraction: true,
    data: {
      url: data.url || '/my-plan',
      dateOfArrival: Date.now(),
    },
    actions: [
      {
        action: 'open',
        title: 'Otevřít stránku',
      },
      {
        action: 'close',
        title: 'Zavřít',
      },
    ],
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'SummerJob', options)
  )
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  if (event.action === 'close') {
    return
  }
  event.waitUntil(clients.openWindow(event.notification.data.url))
})
