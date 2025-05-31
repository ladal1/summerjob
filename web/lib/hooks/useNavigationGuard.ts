import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface UseNavigationGuardProps {
  isDirty: boolean
  isSubmitting?: boolean
}

type NavigationType = 'push' | 'replace' | 'back' | 'forward' | 'external'

interface PendingNavigation {
  type: NavigationType
  href?: string
  options?: { scroll?: boolean }
}

export function useNavigationGuard({
  isDirty,
  isSubmitting = false,
}: UseNavigationGuardProps) {
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [pendingNavigation, setPendingNavigation] =
    useState<PendingNavigation | null>(null)
  const router = useRouter()
  const isNavigatingRef = useRef(false)
  const bypassNextNavigationRef = useRef(false)
  const bypassAllNavigationRef = useRef(false)
  const hasDummyEntryRef = useRef(false)

  // Handle browser navigation (back/forward/refresh/close)
  const handleBeforeUnload = useCallback(
    (e: BeforeUnloadEvent) => {
      if (
        isDirty &&
        !isSubmitting &&
        !isNavigatingRef.current &&
        !bypassNextNavigationRef.current &&
        !bypassAllNavigationRef.current
      ) {
        e.preventDefault()
        e.returnValue = ''
        return ''
      }
    },
    [isDirty, isSubmitting]
  )

  // Handle browser back/forward button navigation
  const handlePopState = useCallback(() => {
    if (
      isDirty &&
      !isSubmitting &&
      !isNavigatingRef.current &&
      !bypassNextNavigationRef.current &&
      !bypassAllNavigationRef.current
    ) {
      // Prevent the navigation by pushing current state again
      window.history.pushState(null, '', window.location.href)

      setPendingNavigation({ type: 'back' })
      setShowConfirmation(true)
    }
  }, [isDirty, isSubmitting])

  // Handle link clicks
  const handleLinkClick = useCallback(
    (e: MouseEvent) => {
      if (
        !isDirty ||
        isSubmitting ||
        isNavigatingRef.current ||
        bypassNextNavigationRef.current ||
        bypassAllNavigationRef.current
      )
        return

      const target = e.target as HTMLElement
      const link = target.closest('a[href]') as HTMLAnchorElement

      if (!link) return

      const href = link.getAttribute('href')
      if (!href) return

      // Check if it's an internal navigation (relative or same origin)
      if (href.startsWith('/') || href.startsWith(window.location.origin)) {
        e.preventDefault()
        e.stopPropagation()

        setPendingNavigation({ type: 'push', href })
        setShowConfirmation(true)
      }
    },
    [isDirty, isSubmitting]
  )

  useEffect(() => {
    // Always clean up first
    const cleanup = () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
      document.removeEventListener('click', handleLinkClick, true)

      // Clean up the dummy history entry
      if (
        hasDummyEntryRef.current &&
        typeof window !== 'undefined' &&
        window.history.length > 1
      ) {
        try {
          window.history.back()
          hasDummyEntryRef.current = false
        } catch {
          // Ignore errors when cleaning up history
        }
      }
    }

    if (!isDirty || isSubmitting || bypassAllNavigationRef.current) {
      // Clean up dummy entry if form is no longer dirty or bypassed
      if (hasDummyEntryRef.current) {
        hasDummyEntryRef.current = false
      }
      // Cleanup any existing listeners
      cleanup()
      return
    }

    // Add a dummy history entry to ensure popstate fires
    window.history.pushState(null, '', window.location.href)
    hasDummyEntryRef.current = true

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handlePopState)
    document.addEventListener('click', handleLinkClick, true)

    return cleanup
  }, [
    isDirty,
    isSubmitting,
    handleBeforeUnload,
    handlePopState,
    handleLinkClick,
  ])

  const interceptNavigation = useCallback(
    (navigationFn: () => void, type: NavigationType = 'external') => {
      if (
        isDirty &&
        !isSubmitting &&
        !isNavigatingRef.current &&
        !bypassNextNavigationRef.current &&
        !bypassAllNavigationRef.current
      ) {
        setPendingNavigation({ type })
        setShowConfirmation(true)
      } else {
        navigationFn()
      }
    },
    [isDirty, isSubmitting]
  )

  const confirmNavigation = useCallback(() => {
    if (pendingNavigation) {
      // Temporarily disable the navigation guard by setting isNavigatingRef
      isNavigatingRef.current = true

      // Clear pending navigation and close dialog immediately
      setPendingNavigation(null)
      setShowConfirmation(false)

      // Execute navigation after a brief delay to ensure dialog is closed
      setTimeout(() => {
        try {
          switch (pendingNavigation.type) {
            case 'push':
              if (pendingNavigation.href) {
                // Use window.location for reliable navigation
                window.location.href = pendingNavigation.href
              }
              break
            case 'replace':
              if (pendingNavigation.href) {
                window.location.replace(pendingNavigation.href)
              }
              break
            case 'back':
              // Go back the appropriate number of steps:
              // - 1 step for the pushState we added in handlePopState
              // - 1 additional step if we have a dummy entry (total 2)
              const stepsBack = hasDummyEntryRef.current ? -2 : -1
              window.history.go(stepsBack)
              hasDummyEntryRef.current = false
              break
            case 'forward':
              window.history.forward()
              break
          }
        } catch (error) {
          console.error('Navigation error:', error)
          // Reset navigation flag on error
          isNavigatingRef.current = false
        }
      }, 50)
    } else {
      setShowConfirmation(false)
    }
  }, [pendingNavigation])

  const cancelNavigation = useCallback(() => {
    setPendingNavigation(null)
    setShowConfirmation(false)
  }, [])

  const bypassNextNavigation = useCallback(() => {
    bypassNextNavigationRef.current = true
  }, [])

  const disableNavigationGuard = useCallback(() => {
    bypassAllNavigationRef.current = true
  }, [])

  // Create intercepted router methods
  const interceptedRouter = {
    push: useCallback(
      (href: string, options?: { scroll?: boolean }) => {
        if (bypassNextNavigationRef.current) {
          bypassNextNavigationRef.current = false
          router.push(href, options)
        } else if (
          isDirty &&
          !isSubmitting &&
          !isNavigatingRef.current &&
          !bypassAllNavigationRef.current
        ) {
          setPendingNavigation({ type: 'push', href, options })
          setShowConfirmation(true)
        } else {
          router.push(href, options)
        }
      },
      [isDirty, isSubmitting, router]
    ),

    replace: useCallback(
      (href: string, options?: { scroll?: boolean }) => {
        if (bypassNextNavigationRef.current) {
          bypassNextNavigationRef.current = false
          router.replace(href, options)
        } else if (
          isDirty &&
          !isSubmitting &&
          !isNavigatingRef.current &&
          !bypassAllNavigationRef.current
        ) {
          setPendingNavigation({ type: 'replace', href, options })
          setShowConfirmation(true)
        } else {
          router.replace(href, options)
        }
      },
      [isDirty, isSubmitting, router]
    ),

    back: useCallback(() => {
      if (bypassNextNavigationRef.current) {
        bypassNextNavigationRef.current = false
        router.back()
      } else if (
        isDirty &&
        !isSubmitting &&
        !isNavigatingRef.current &&
        !bypassAllNavigationRef.current
      ) {
        setPendingNavigation({ type: 'back' })
        setShowConfirmation(true)
      } else {
        router.back()
      }
    }, [isDirty, isSubmitting, router]),

    forward: useCallback(() => {
      if (bypassNextNavigationRef.current) {
        bypassNextNavigationRef.current = false
        router.forward()
      } else if (
        isDirty &&
        !isSubmitting &&
        !isNavigatingRef.current &&
        !bypassAllNavigationRef.current
      ) {
        setPendingNavigation({ type: 'forward' })
        setShowConfirmation(true)
      } else {
        router.forward()
      }
    }, [isDirty, isSubmitting, router]),

    refresh: router.refresh,
    prefetch: router.prefetch,
  }

  return {
    showConfirmation,
    confirmNavigation,
    cancelNavigation,
    interceptNavigation,
    bypassNextNavigation,
    disableNavigationGuard,
    router: interceptedRouter,
  }
}
