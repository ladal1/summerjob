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

function serialize(assignments: AssignmentsMap, courierNums: number[]): string {
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
  return JSON.stringify({ entries, couriers: [...courierNums].sort() })
}

export function useFoodDeliveryState(planId: string) {
  const { data: deliveries, error, mutate } = useFoodDeliveries(planId)
  const { trigger: bulkReplace } = useFoodDeliveryBulkReplace(planId)

  const [assignments, setAssignments] = useState<AssignmentsMap>(new Map())
  const [courierNums, setCourierNums] = useState<number[]>([])
  const [saveState, setSaveState] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle')
  const [saveError, setSaveError] = useState<string | null>(null)

  const lastSavedRef = useRef<string>('')
  const initializedRef = useRef(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Hydrate state from server once data arrives
  useEffect(() => {
    if (!deliveries || initializedRef.current) return
    const map = assignmentsFromDeliveries(deliveries)
    const nums = deliveries.map(d => d.courierNum).sort((a, b) => a - b)
    setAssignments(map)
    setCourierNums(nums)
    lastSavedRef.current = serialize(map, nums)
    initializedRef.current = true
  }, [deliveries])

  const persist = useCallback(
    async (next: AssignmentsMap, nextCouriers: number[]) => {
      const snapshot = serialize(next, nextCouriers)
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
    (next: AssignmentsMap, nextCouriers: number[]) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        persist(next, nextCouriers)
      }, SAVE_DEBOUNCE_MS)
    },
    [persist]
  )

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
        scheduleSave(nextA, nextNums)
        return nextA
      })
    },
    [courierNums, scheduleSave]
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
    scheduleSave(assignments, nextCouriers)
  }, [assignments, courierNums, scheduleSave])

  const removeCourier = useCallback(
    (courierNum: number) => {
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
    saveState,
    saveError,
    assignJob,
    unassignJob,
    setRecipients,
    addCourier,
    removeCourier,
    clearAll,
    deliveryIdByCourier,
  }
}
