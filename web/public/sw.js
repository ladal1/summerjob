self.addEventListener('push', function (event) {
  let data = { title: 'Test noticication', body: 'Test notification body' }

  try {
    if (event.data) data = event.data.json()
  } catch {
    if (event.data)
      data = { title: 'Test notification', body: event.data.text() }
  }

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
  event.waitUntil(clients.openWindow('/my-plan'))
})
