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

function isIOS() {
  const ua = window.navigator.userAgent.toLowerCase()
  return /iphone|ipad|ipod/i.test(ua)
}

function isIOSStandalone() {
  return isIOS() && window.matchMedia('(display-mode: standalone)').matches
}

export default function PushNotificationManagerButton() {
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isShown, setIsShown] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    ) {
      void registerServiceWorker()
    }
  }, [])

  async function registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      })

      const sub = await registration.pushManager.getSubscription()

      if (sub) {
        // If subscription exists in browser, rebind it to the currently logged in user
        const res = await fetch('/api/push-subscription/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sub),
        })
        if (!res.ok) {
          setIsShown(true)
        }
      } else {
        setIsShown(true)
      }
    } catch {}
  }

  async function subscribeToPush() {
    setLoading(true)
    setErrorMessage('')

    if (Notification.permission === 'denied') {
      setErrorMessage(
        'Oznámení jsou v prohlížeči zablokována - povolte je a zkuste to znovu'
      )
      setLoading(false)
      return
    }

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      setErrorMessage(
        'Oznámení jsou v prohlížeči zablokována - povolte je a zkuste to znovu'
      )
      setLoading(false)
      return
    }

    let sub: PushSubscription | null = null
    try {
      const registration = await navigator.serviceWorker.ready
      sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      })
      const res = await fetch('/api/push-subscription/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      })

      if (!res.ok) {
        throw new Error()
      }

      setSuccess(true)
      setTimeout(() => setIsShown(false), 5000)
    } catch {
      if (sub) {
        try {
          await sub.unsubscribe()
        } catch {}
      }
      setErrorMessage('Došlo k chybě, zkuste to prosím později')
    } finally {
      setLoading(false)
    }
  }

  async function handleClick() {
    if (isIOS() && !isIOSStandalone()) {
      setErrorMessage(
        'Na iPhonu si nejdříve stránku uložte na domovskou obrazovku'
      )
    } else {
      await subscribeToPush()
    }
  }

  return (
    <>
      {isShown && (
        <div
          className={`${success ? 'bg-success' : 'bg-warning'} d-flex align-items-center justify-content-center px-0 py-1`}
        >
          {errorMessage ? (
            <span className="ms-auto text-center">{errorMessage}</span>
          ) : (
            <>
              {success ? (
                <span className="ms-auto text-light">
                  Oznámení byla úspěšně zapnuta
                </span>
              ) : (
                <button
                  className="btn btn-link shadow-none text-dark p-0 ms-auto"
                  type="button"
                  onClick={handleClick}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="spinner-border spinner-border-sm text-small"></div>
                  ) : (
                    <span>Zapnout oznámení</span>
                  )}
                </button>
              )}
            </>
          )}

          <button
            className={`btn-close ms-auto me-1 ${!success && 'btn-close-white'}`}
            role="status"
            type="button"
            onClick={() => setIsShown(false)}
          ></button>
        </div>
      )}
    </>
  )
}
