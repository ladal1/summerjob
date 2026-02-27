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
  const [loading, setLoading] = useState(false)
  const [supported, setSupported] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    ) {
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
    setErrorMessage('')
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      setLoading(false)
      return
    }

    const registration = await navigator.serviceWorker.ready
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      ),
    })

    try {
      const res = await fetch('/api/push-subscription/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      })

      if (!res.ok) {
        throw new Error()
      }
      setSubscription(sub)
    } catch {
      setErrorMessage('Došlo k chybě, zkuste to prosím později')
    } finally {
      setLoading(false)
    }
  }

  async function unsubscribeFromPush() {
    setLoading(true)
    const endpoint = subscription?.endpoint
    await subscription?.unsubscribe()

    try {
      const res = await fetch('/api/push-subscription/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint }),
      })

      if (!res.ok) {
        throw new Error()
      }
    } catch {
      setErrorMessage('Došlo k chybě, zkuste to prosím později')
    }

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
      <p className="text-danger mt-2">{errorMessage}</p>
    </div>
  )
}
