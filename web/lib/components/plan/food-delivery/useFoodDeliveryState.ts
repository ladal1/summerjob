import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  useFoodDeliveries,
  useFoodDeliveryBulkReplace,
} from 'lib/fetcher/food-delivery'
import { FoodDeliveryAPIGetResponse } from 'pages/api/plans/[planId]/food-deliveries'

export type Assignment = {
  courierNum: number
  recipientIds: Set<string>
}

export type AssignmentsMap = Map<string, Assignment>
export type CourierNotesMap = Map<number, string>

const SAVE_DEBOUNCE_MS = 700

function assignmentsFromDeliveries(
  deliveries: FoodDeliveryAPIGetResponse | undefined
): AssignmentsMap {
  const map: AssignmentsMap = new Map()
  if (!deliveries) return map
  for (const delivery of deliveries) {
    for (const jobOrder of delivery.jobs) {
      map.set(jobOrder.activeJobId, {
        courierNum: delivery.courierNum,
        recipientIds: new Set(jobOrder.recipients.map(r => r.id)),
      })
    }
  }
  return map
}

function notesFromDeliveries(
  deliveries: FoodDeliveryAPIGetResponse | undefined
): CourierNotesMap {
  const map: CourierNotesMap = new Map()
  if (!deliveries) return map
  for (const delivery of deliveries) {
    if (delivery.notes) map.set(delivery.courierNum, delivery.notes)
  }
  return map
}

function serialize(
  assignments: AssignmentsMap,
  courierNums: number[],
  notes: CourierNotesMap
): string {
  const entries = Array.from(assignments.entries())
    .map(
      ([jobId, a]) =>
        [
          jobId,
          a.courierNum,
          Array.from(a.recipientIds).sort().join('|'),
        ] as const
    )
    .sort((a, b) => a[0].localeCompare(b[0]))
  const noteEntries = Array.from(notes.entries()).sort((a, b) => a[0] - b[0])
  return JSON.stringify({
    entries,
    couriers: [...courierNums].sort(),
    notes: noteEntries,
  })
}

export function useFoodDeliveryState(planId: string) {
  const { data: deliveries, error, mutate } = useFoodDeliveries(planId)
  const { trigger: bulkReplace } = useFoodDeliveryBulkReplace(planId)

  const [assignments, setAssignments] = useState<AssignmentsMap>(new Map())
  const [courierNums, setCourierNums] = useState<number[]>([])
  const [courierNotes, setCourierNotes] = useState<CourierNotesMap>(new Map())
  const [saveState, setSaveState] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle')
  const [saveError, setSaveError] = useState<string | null>(null)

  const lastSavedRef = useRef<string>('')
  const initializedRef = useRef(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingSaveRef = useRef<{
    next: AssignmentsMap
    nextCouriers: number[]
    nextNotes: CourierNotesMap
  } | null>(null)

  // Hydrate state from server once data arrives
  useEffect(() => {
    if (!deliveries || initializedRef.current) return
    const map = assignmentsFromDeliveries(deliveries)
    const nums = deliveries.map(d => d.courierNum).sort((a, b) => a - b)
    const notes = notesFromDeliveries(deliveries)
    setAssignments(map)
    setCourierNums(nums)
    setCourierNotes(notes)
    lastSavedRef.current = serialize(map, nums, notes)
    initializedRef.current = true
  }, [deliveries])

  const persist = useCallback(
    async (
      next: AssignmentsMap,
      nextCouriers: number[],
      nextNotes: CourierNotesMap
    ) => {
      const snapshot = serialize(next, nextCouriers, nextNotes)
      if (snapshot === lastSavedRef.current) return

      setSaveState('saving')
      setSaveError(null)

      const byCourier = new Map<
        number,
        Array<{ jobId: string; recipientIds: string[] }>
      >()
      for (const num of nextCouriers) byCourier.set(num, [])
      for (const [jobId, a] of next) {
        if (!byCourier.has(a.courierNum)) byCourier.set(a.courierNum, [])
        byCourier
          .get(a.courierNum)!
          .push({ jobId, recipientIds: Array.from(a.recipientIds) })
      }

      const payload = Array.from(byCourier.entries()).map(
        ([courierNum, jobs]) => ({
          courierNum,
          planId,
          notes: nextNotes.get(courierNum) ?? null,
          jobs: jobs.map((j, idx) => ({
            activeJobId: j.jobId,
            order: idx + 1,
            recipientIds: j.recipientIds,
          })),
        })
      )

      try {
        await bulkReplace(payload)
        lastSavedRef.current = snapshot
        pendingSaveRef.current = null
        setSaveState('saved')
        setTimeout(() => setSaveState(s => (s === 'saved' ? 'idle' : s)), 1500)
        mutate()
      } catch (e) {
        setSaveState('error')
        setSaveError(e instanceof Error ? e.message : 'Chyba při ukládání')
      }
    },
    [bulkReplace, mutate, planId]
  )

  const scheduleSave = useCallback(
    (
      next: AssignmentsMap,
      nextCouriers: number[],
      nextNotes: CourierNotesMap
    ) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      pendingSaveRef.current = { next, nextCouriers, nextNotes }
      saveTimerRef.current = setTimeout(() => {
        saveTimerRef.current = null
        persist(next, nextCouriers, nextNotes)
      }, SAVE_DEBOUNCE_MS)
    },
    [persist]
  )

  // Flush any pending debounced save when the user is about to leave the page
  // and warn them if a save is currently in flight or queued.
  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (pendingSaveRef.current || saveState === 'saving') {
        e.preventDefault()
        // Required for legacy browsers; modern browsers show a generic message.
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', beforeUnload)
    return () => window.removeEventListener('beforeunload', beforeUnload)
  }, [saveState])

  // On unmount: if there is a pending debounced save, fire it immediately so
  // changes aren't lost when the user navigates away within the debounce window.
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
        saveTimerRef.current = null
      }
      const pending = pendingSaveRef.current
      if (pending) {
        // Best-effort fire; SWR mutation may or may not complete before unload.
        persist(pending.next, pending.nextCouriers, pending.nextNotes).catch(
          () => {}
        )
      }
    }
    // Intentionally omit `persist` from deps — we want this cleanup to run only
    // on real unmount, not whenever persist's identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateAssignments = useCallback(
    (
      updater: (
        prev: AssignmentsMap,
        couriers: number[]
      ) => { assignments: AssignmentsMap; courierNums: number[] }
    ) => {
      setAssignments(prevA => {
        const { assignments: nextA, courierNums: nextNums } = updater(
          prevA,
          courierNums
        )
        setCourierNums(nextNums)
        scheduleSave(nextA, nextNums, courierNotes)
        return nextA
      })
    },
    [courierNums, courierNotes, scheduleSave]
  )

  const setCourierNote = useCallback(
    (courierNum: number, note: string) => {
      setCourierNotes(prev => {
        const next = new Map(prev)
        if (note.trim() === '') next.delete(courierNum)
        else next.set(courierNum, note)
        scheduleSave(assignments, courierNums, next)
        return next
      })
    },
    [assignments, courierNums, scheduleSave]
  )

  const assignJob = useCallback(
    (jobId: string, courierNum: number, defaultRecipientIds: string[]) => {
      updateAssignments(prev => {
        const next = new Map(prev)
        const existing = prev.get(jobId)
        next.set(jobId, {
          courierNum,
          recipientIds: existing
            ? existing.recipientIds
            : new Set(defaultRecipientIds),
        })
        const couriers = courierNums.includes(courierNum)
          ? courierNums
          : [...courierNums, courierNum].sort((a, b) => a - b)
        return { assignments: next, courierNums: couriers }
      })
    },
    [courierNums, updateAssignments]
  )

  const unassignJob = useCallback(
    (jobId: string) => {
      updateAssignments(prev => {
        const next = new Map(prev)
        next.delete(jobId)
        return { assignments: next, courierNums }
      })
    },
    [courierNums, updateAssignments]
  )

  const setRecipients = useCallback(
    (jobId: string, recipientIds: Set<string>) => {
      updateAssignments(prev => {
        const entry = prev.get(jobId)
        if (!entry) return { assignments: prev, courierNums }
        const next = new Map(prev)
        next.set(jobId, { ...entry, recipientIds })
        return { assignments: next, courierNums }
      })
    },
    [courierNums, updateAssignments]
  )

  const addCourier = useCallback(() => {
    const nextNum = courierNums.length === 0 ? 1 : Math.max(...courierNums) + 1
    const nextCouriers = [...courierNums, nextNum]
    setCourierNums(nextCouriers)
    scheduleSave(assignments, nextCouriers, courierNotes)
  }, [assignments, courierNums, courierNotes, scheduleSave])

  const removeCourier = useCallback(
    (courierNum: number) => {
      // Drop any note for the removed courier as well.
      setCourierNotes(prev => {
        if (!prev.has(courierNum)) return prev
        const next = new Map(prev)
        next.delete(courierNum)
        return next
      })
      updateAssignments(prev => {
        const next = new Map(prev)
        for (const [jobId, a] of prev) {
          if (a.courierNum === courierNum) next.delete(jobId)
        }
        const couriers = courierNums.filter(c => c !== courierNum)
        return { assignments: next, courierNums: couriers }
      })
    },
    [courierNums, updateAssignments]
  )

  const clearAll = useCallback(() => {
    updateAssignments(() => ({
      assignments: new Map(),
      courierNums: courierNums,
    }))
  }, [courierNums, updateAssignments])

  const deliveryIdByCourier = useMemo(() => {
    const map = new Map<number, string>()
    for (const d of deliveries ?? []) map.set(d.courierNum, d.id)
    return map
  }, [deliveries])

  return {
    deliveries,
    loadError: error,
    assignments,
    courierNums,
    courierNotes,
    saveState,
    saveError,
    assignJob,
    unassignJob,
    setRecipients,
    setCourierNote,
    addCourier,
    removeCourier,
    clearAll,
    deliveryIdByCourier,
  }
}
