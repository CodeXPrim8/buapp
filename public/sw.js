self.addEventListener('push', (event) => {
  let payload = {}
  if (event.data) {
    try {
      payload = event.data.json()
    } catch (err) {
      payload = { title: 'BU Notification', body: event.data.text() }
    }
  }

  const title = payload.title || 'BU Notification'
  const options = {
    body: payload.body || '',
    icon: '/icon-light-32x32.png',
    badge: '/icon-light-32x32.png',
    data: payload.data || {},
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification?.data?.url || '/?page=notifications'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
      return undefined
    })
  )
})
