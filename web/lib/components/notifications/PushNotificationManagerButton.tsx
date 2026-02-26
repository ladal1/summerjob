'use client'

import { useEffect, useState } from 'react'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default function PushNotificationManagerButton() {
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null
  )
  const [loading, setLoading] = useState<boolean>(false)
  const [supported, setSupported] = useState<boolean>(false)

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setSupported(true)
      registerServiceWorker()
    }
  }, [])

  async function registerServiceWorker() {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    })
    const sub = await registration.pushManager.getSubscription()
    setSubscription(sub)
  }

  async function subscribeToPush() {
    setLoading(true)
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      setLoading(false)
      return
    }

    const registration = await navigator.serviceWorker.ready
    console.log('registration:', registration)
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      ),
    })

    console.log('sub:', sub)

    await fetch('/api/push-subscription/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sub),
    })

    setSubscription(sub)
    setLoading(false)
  }

  async function unsubscribeFromPush() {
    setLoading(true)
    const endpoint = subscription?.endpoint
    await subscription?.unsubscribe()

    // Remove/deactivate on server
    await fetch('/api/push-subscription/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint }),
    })

    // Re-check actual browser state
    const registration = await navigator.serviceWorker.ready
    const current = await registration.pushManager.getSubscription()
    setSubscription(current)
    setLoading(false)
  }

  if (!supported) {
    return <span>Oznámení nejsou na tomto zařízení podporována</span>
  }

  return (
    <div>
      {subscription ? (
        <>
          <button
            className="btn btn-success"
            type="button"
            onClick={unsubscribeFromPush}
            disabled={loading}
          >
            Vypnout oznámení
          </button>
        </>
      ) : (
        <>
          <button
            className="btn btn-light"
            type="button"
            onClick={subscribeToPush}
            disabled={loading}
          >
            Zapnout oznámení
          </button>
        </>
      )}
    </div>
  )
}
