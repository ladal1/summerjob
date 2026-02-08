'use client'
import ErrorPage from 'lib/components/error-page/ErrorPage'
import PageHeader from 'lib/components/page-header/PageHeader'
import { useAPIPlan } from 'lib/fetcher/plan'
import { formatDateLong } from 'lib/helpers/helpers'
import { ActiveJobNoPlan } from 'lib/types/active-job'
import { deserializePlan } from 'lib/types/plan'
import { Serialized } from 'lib/types/serialize'
import Link from 'next/link'
import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import ErrorPage404 from '../404/404'
import {
  useFoodDeliveries,
  useFoodDeliveryBulkReplace,
} from 'lib/fetcher/food-delivery'

// Dynamically import JobsMapView to avoid SSR issues with Leaflet
const JobsMapView = dynamic(() => import('./JobsMapView'), {
  ssr: false,
  loading: () => <div className="text-center p-3">Načítání mapy...</div>,
})

interface FoodDeliveryClientPageProps {
  planId: string
  initialDataPlan?: Serialized
}

export default function FoodDeliveryClientPage({
  planId,
  initialDataPlan,
}: FoodDeliveryClientPageProps) {
  const initialDataPlanParsed = initialDataPlan
    ? deserializePlan(initialDataPlan)
    : undefined

  const { data: planData, error } = useAPIPlan(planId, {
    fallbackData: initialDataPlanParsed,
  })

  // Filter jobs that either have workers with food allergies OR don't have food on site
  const jobsWithFoodDeliveryNeeds = useMemo(() => {
    if (!planData) return []

    const jobsNeedingDelivery: Array<{
      job: ActiveJobNoPlan
      workersWithAllergies: Array<{
        id: string
        firstName: string
        lastName: string
        phone: string
        age?: number
        allergies: string[]
      }>
      needsFoodDelivery: boolean
      hasWorkersWithAllergies: boolean
    }> = []

    planData.jobs.forEach(job => {
      const workersWithAllergies = job.workers
        .filter(worker => worker.foodAllergies.length > 0)
        .map(worker => ({
          id: worker.id,
          firstName: worker.firstName,
          lastName: worker.lastName,
          phone: worker.phone,
          age: worker.age || undefined,
          allergies: worker.foodAllergies.map(allergy => allergy.name),
        }))

      const needsFoodDelivery = !job.proposedJob.hasFood
      const hasWorkersWithAllergies = workersWithAllergies.length > 0

      // Include job if it either needs food delivery OR has workers with allergies
      if (needsFoodDelivery || hasWorkersWithAllergies) {
        jobsNeedingDelivery.push({
          job,
          workersWithAllergies,
          needsFoodDelivery,
          hasWorkersWithAllergies,
        })
      }
    })

    return jobsNeedingDelivery
  }, [planData])

  // Flatten all workers with allergies for individual display
  const allWorkersWithAllergies = useMemo(() => {
    const workers: Array<{
      id: string
      firstName: string
      lastName: string
      phone: string
      age?: number
      allergies: string[]
      jobName: string
      jobAddress: string
      areaName: string
    }> = []

    jobsWithFoodDeliveryNeeds.forEach(({ job, workersWithAllergies }) => {
      workersWithAllergies.forEach(worker => {
        workers.push({
          ...worker,
          jobName: job.proposedJob.name,
          jobAddress: job.proposedJob.address,
          areaName: job.proposedJob.area?.name || 'Nezadaná oblast',
        })
      })
    })

    return workers.sort(
      (a, b) =>
        a.lastName.localeCompare(b.lastName) ||
        a.firstName.localeCompare(b.firstName)
    )
  }, [jobsWithFoodDeliveryNeeds])

  // Job selection state and functionality - only for jobs with allergic workers
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set())
  const [showJobMap, setShowJobMap] = useState(false)
  const [showCourierMap, setShowCourierMap] = useState<{
    [courierNum: number]: boolean
  }>({})

  // Courier management state
  const [showCourierAssignment, setShowCourierAssignment] = useState(false)
  const [jobCourierAssignments, setJobCourierAssignments] = useState<
    Map<string, number>
  >(new Map())

  // UI feedback state
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [saveMessageType, setSaveMessageType] = useState<'success' | 'error'>(
    'success'
  )
  const [isOperationLoading, setIsOperationLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [removingJobIds, setRemovingJobIds] = useState<Set<string>>(new Set())
  const [pendingOperations, setPendingOperations] = useState<Set<string>>(
    new Set()
  )
  const [hasPendingChanges, setHasPendingChanges] = useState(false)

  // Track last saved state to prevent unnecessary saves
  const lastSavedStateRef = useRef<string>('')

  // Food delivery data from database
  const {
    data: foodDeliveries,
    error: foodDeliveriesError,
    mutate: mutateFoodDeliveries,
  } = useFoodDeliveries(planId)

  const { trigger: bulkReplaceFoodDeliveries } =
    useFoodDeliveryBulkReplace(planId)

  // Load existing food deliveries on component mount
  useEffect(() => {
    if (foodDeliveries && foodDeliveries.length > 0) {
      const assignments = new Map<string, number>()

      foodDeliveries.forEach(delivery => {
        delivery.jobs.forEach(jobOrder => {
          assignments.set(jobOrder.activeJobId, delivery.courierNum)
        })
      })

      setJobCourierAssignments(assignments)
    }
  }, [foodDeliveries])

  const toggleJobSelection = useCallback((jobId: string) => {
    setSelectedJobIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(jobId)) {
        newSet.delete(jobId)
      } else {
        newSet.add(jobId)
      }
      return newSet
    })
  }, [])

  const clearJobSelection = useCallback(() => {
    setSelectedJobIds(new Set())
  }, [])

  const toggleCourierMap = useCallback((courierNumber: number) => {
    setShowCourierMap(prev => ({
      ...prev,
      [courierNumber]: !prev[courierNumber],
    }))
  }, [])

  // Courier assignment functions
  const assignJobToCourier = useCallback(
    (jobId: string, courierNumber: number) => {
      // Mark operation as pending
      setPendingOperations(prev => new Set([...prev, jobId]))

      // Update local state immediately for responsive UI
      setJobCourierAssignments(prev => {
        const newMap = new Map(prev)
        newMap.set(jobId, courierNumber)
        return newMap
      })

      // Show immediate feedback
      setSaveMessage(`Job přiřazen rozvozníkovi ${courierNumber}`)
      setSaveMessageType('success')

      // Clear pending operation after a short delay
      setTimeout(() => {
        setPendingOperations(prev => {
          const newSet = new Set(prev)
          newSet.delete(jobId)
          return newSet
        })
        setTimeout(() => setSaveMessage(null), 1000)
      }, 300)
    },
    []
  )

  const unassignJob = useCallback((jobId: string) => {
    // Mark operation as pending and job as being removed
    setPendingOperations(prev => new Set([...prev, jobId]))
    setRemovingJobIds(prev => new Set([...prev, jobId]))

    // Show immediate feedback
    setSaveMessage('Odebírám přiřazení...')
    setSaveMessageType('success')

    // Add a small delay to show the removing state before actually removing
    setTimeout(() => {
      setJobCourierAssignments(prev => {
        const newMap = new Map(prev)
        newMap.delete(jobId)
        return newMap
      })

      // Update message after removal
      setSaveMessage('Přiřazení odebráno')

      // Remove from both pending and removing states after a short delay
      setTimeout(() => {
        setPendingOperations(prev => {
          const newSet = new Set(prev)
          newSet.delete(jobId)
          return newSet
        })
        setRemovingJobIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(jobId)
          return newSet
        })

        // Clear message
        setTimeout(() => setSaveMessage(null), 1000)
      }, 300)
    }, 200)
  }, [])

  // Clear all assignments
  const clearAllAssignments = useCallback(() => {
    // Mark all assigned jobs as being removed and pending
    const assignedJobIds = Array.from(jobCourierAssignments.keys())
    setPendingOperations(new Set(assignedJobIds))
    setRemovingJobIds(new Set(assignedJobIds))

    setSaveMessage('Odebírám všechna přiřazení...')
    setSaveMessageType('success')

    // Add delay to show removing state
    setTimeout(() => {
      setJobCourierAssignments(new Map())
      setSaveMessage('Všechna přiřazení odebrána')

      // Clear both pending and removing states
      setTimeout(() => {
        setPendingOperations(new Set())
        setRemovingJobIds(new Set())
        setTimeout(() => setSaveMessage(null), 1000)
      }, 300)
    }, 500)
  }, [jobCourierAssignments])

  // Add new courier
  const addNewCourier = useCallback(async () => {
    const existingCourierNumbers = foodDeliveries
      ? foodDeliveries.map(d => d.courierNum)
      : []
    const newCourierNumber =
      existingCourierNumbers.length > 0
        ? Math.max(...existingCourierNumbers) + 1
        : 1

    setIsOperationLoading(true)
    try {
      // Create an empty delivery directly via API
      const response = await fetch(`/api/plans/${planId}/food-deliveries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courierNum: newCourierNumber,
          planId,
          jobs: [],
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create new courier')
      }

      await mutateFoodDeliveries() // Refresh the data

      setSaveMessage(`Rozvozník ${newCourierNumber} byl přidán.`)
      setSaveMessageType('success')
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error) {
      console.error('Failed to add new courier:', error)
      setSaveMessage('Chyba při přidávání nového rozvozníka.')
      setSaveMessageType('error')
      setTimeout(() => setSaveMessage(null), 5000)
    } finally {
      setIsOperationLoading(false)
    }
  }, [foodDeliveries, planId, mutateFoodDeliveries])

  // Remove courier and unassign all their jobs
  const removeCourier = useCallback(
    async (courierNumber: number) => {
      if (
        !confirm(
          `Opravdu chcete odstranit rozvozníka ${courierNumber} a zrušit všechna jeho přiřazení?`
        )
      ) {
        return
      }

      setIsOperationLoading(true)
      try {
        // Find the delivery to delete
        const deliveryToDelete = foodDeliveries?.find(
          d => d.courierNum === courierNumber
        )
        if (deliveryToDelete) {
          const response = await fetch(
            `/api/plans/${planId}/food-deliveries/${deliveryToDelete.id}`,
            {
              method: 'DELETE',
            }
          )

          if (!response.ok) {
            throw new Error('Failed to delete courier')
          }

          await mutateFoodDeliveries() // Refresh the data
        }

        // Update local state by removing all assignments for this courier
        setJobCourierAssignments(prev => {
          const newMap = new Map(prev)
          for (const [jobId, assignedCourier] of newMap) {
            if (assignedCourier === courierNumber) {
              newMap.delete(jobId)
            }
          }
          return newMap
        })

        setSaveMessage(`Rozvozník ${courierNumber} byl odstraněn.`)
        setSaveMessageType('success')
        setTimeout(() => setSaveMessage(null), 3000)
      } catch (error) {
        console.error('Failed to remove courier:', error)
        setSaveMessage(`Chyba při odstraňování rozvozníka ${courierNumber}.`)
        setSaveMessageType('error')
        setTimeout(() => setSaveMessage(null), 5000)
      } finally {
        setIsOperationLoading(false)
      }
    },
    [foodDeliveries, planId, mutateFoodDeliveries]
  )

  // Reorder job within courier's delivery route
  const reorderJobInCourier = useCallback(
    async (courierNumber: number, jobId: string, direction: 'up' | 'down') => {
      if (!foodDeliveries) return

      const delivery = foodDeliveries.find(d => d.courierNum === courierNumber)
      if (!delivery) return

      const jobIndex = delivery.jobs.findIndex(job => job.activeJobId === jobId)
      if (jobIndex === -1) return

      const newIndex = direction === 'up' ? jobIndex - 1 : jobIndex + 1
      if (newIndex < 0 || newIndex >= delivery.jobs.length) return

      setIsOperationLoading(true)
      try {
        // Create updated job order
        const updatedJobs = [...delivery.jobs]
        const [movedJob] = updatedJobs.splice(jobIndex, 1)
        updatedJobs.splice(newIndex, 0, movedJob)

        // Update order numbers
        const reorderedJobs = updatedJobs.map((job, index) => ({
          ...job,
          order: index + 1,
        }))

        // Update this delivery
        const updatedDelivery = {
          ...delivery,
          jobs: reorderedJobs,
        }

        // Replace all deliveries with updated one
        const allDeliveries = foodDeliveries
          .map(d => (d.courierNum === courierNumber ? updatedDelivery : d))
          .map(d => ({
            courierNum: d.courierNum,
            planId: d.planId,
            jobs: d.jobs.map(job => ({
              activeJobId: job.activeJobId,
              order: job.order,
            })),
          }))

        await bulkReplaceFoodDeliveries(allDeliveries)
        await mutateFoodDeliveries()

        setSaveMessage('Pořadí jobů aktualizováno')
        setSaveMessageType('success')
        setTimeout(() => setSaveMessage(null), 2000)
      } catch (error) {
        console.error('Failed to reorder jobs:', error)
        setSaveMessage('Chyba při změně pořadí jobů')
        setSaveMessageType('error')
        setTimeout(() => setSaveMessage(null), 5000)
      } finally {
        setIsOperationLoading(false)
      }
    },
    [foodDeliveries, bulkReplaceFoodDeliveries, mutateFoodDeliveries]
  )

  // Debounced bulk update for assignment changes
  const debouncedBulkUpdate = useCallback(() => {
    const timeoutId = setTimeout(async () => {
      // Don't save if already saving or no data available
      if (isSaving || !planData || foodDeliveries === undefined) return

      // Create a serialized representation of current assignments for comparison
      const currentStateString = JSON.stringify(
        Array.from(jobCourierAssignments.entries()).sort()
      )

      // Check if the state has actually changed from what we last saved
      if (currentStateString === lastSavedStateRef.current) {
        setHasPendingChanges(false)
        return
      }

      // Check if current assignments are different from saved deliveries
      const currentAssignments = new Map<string, number>()
      foodDeliveries.forEach(delivery => {
        delivery.jobs.forEach(jobOrder => {
          currentAssignments.set(jobOrder.activeJobId, delivery.courierNum)
        })
      })

      // Compare current state with saved state
      let hasChanges = false
      if (currentAssignments.size !== jobCourierAssignments.size) {
        hasChanges = true
      } else {
        for (const [jobId, courierNum] of jobCourierAssignments) {
          if (currentAssignments.get(jobId) !== courierNum) {
            hasChanges = true
            break
          }
        }
      }

      // Only save if there are actual changes
      if (!hasChanges) {
        lastSavedStateRef.current = currentStateString
        setHasPendingChanges(false)
        return
      }

      setIsSaving(true)
      setIsOperationLoading(true)

      try {
        const assignmentsByDelivery = new Map<number, string[]>()

        // First, initialize all existing couriers with empty arrays to preserve them
        if (foodDeliveries) {
          foodDeliveries.forEach(delivery => {
            assignmentsByDelivery.set(delivery.courierNum, [])
          })
        }

        // Then, group jobs by courier (this will populate the arrays for couriers with jobs)
        jobCourierAssignments.forEach((courierNum, jobId) => {
          if (!assignmentsByDelivery.has(courierNum)) {
            assignmentsByDelivery.set(courierNum, [])
          }
          assignmentsByDelivery.get(courierNum)!.push(jobId)
        })

        // Create delivery data for the bulk replace - includes all couriers, even empty ones
        const deliveryData = Array.from(assignmentsByDelivery.entries()).map(
          ([courierNum, jobIds]) => ({
            courierNum,
            planId,
            jobs: jobIds.map((jobId, index) => ({
              activeJobId: jobId,
              order: index + 1,
            })),
          })
        )

        await bulkReplaceFoodDeliveries(deliveryData)

        // Update the ref to track the saved state
        lastSavedStateRef.current = currentStateString

        setSaveMessage('Změny uloženy')
        setSaveMessageType('success')
        setTimeout(() => setSaveMessage(null), 1500)

        // Only refresh data if no more pending operations to prevent interference
        setTimeout(() => {
          if (!hasPendingChanges && pendingOperations.size === 0) {
            mutateFoodDeliveries()
          }
        }, 200)
      } catch (error) {
        console.error('Failed to save food delivery assignments:', error)
        let errorMessage = 'Chyba při ukládání změn.'
        if (error instanceof Error) {
          errorMessage += ` Detail: ${error.message}`
        }
        setSaveMessage(errorMessage)
        setSaveMessageType('error')
        setTimeout(() => setSaveMessage(null), 5000)
      } finally {
        setIsOperationLoading(false)
        setIsSaving(false)
        setHasPendingChanges(false)
      }
    }, 800) // Reduced debounce for faster responsiveness

    return timeoutId
  }, [
    jobCourierAssignments,
    planData,
    foodDeliveries,
    isSaving,
    planId,
    bulkReplaceFoodDeliveries,
    mutateFoodDeliveries,
    hasPendingChanges,
    pendingOperations.size,
  ])

  // Trigger debounced bulk update when assignments change
  useEffect(() => {
    if (!hasPendingChanges) return

    const timeoutId = debouncedBulkUpdate()
    return () => clearTimeout(timeoutId)
  }, [hasPendingChanges, debouncedBulkUpdate])

  // Effect to detect assignment changes and mark as pending
  useEffect(() => {
    // Don't trigger on initial load
    if (!planData || foodDeliveries === undefined) return

    // Create a serialized representation of current assignments for comparison
    const currentStateString = JSON.stringify(
      Array.from(jobCourierAssignments.entries()).sort()
    )

    // Check if the state has actually changed from what we last saved
    if (currentStateString !== lastSavedStateRef.current) {
      setHasPendingChanges(true)
    }
  }, [jobCourierAssignments, planData, foodDeliveries])

  // Group jobs by courier assignment
  const jobsByCourier = useMemo(() => {
    if (!foodDeliveries) return []

    // Get all courier numbers from saved deliveries AND any that exist only in local state
    const savedCourierNumbers = new Set(
      foodDeliveries.map(delivery => delivery.courierNum)
    )
    const localCourierNumbers = new Set(
      Array.from(jobCourierAssignments.values())
    )
    const allCourierNumbers = Array.from(
      new Set([...savedCourierNumbers, ...localCourierNumbers])
    ).sort((a, b) => a - b)

    return allCourierNumbers
      .map(courierNumber => {
        const delivery = foodDeliveries.find(
          d => d.courierNum === courierNumber
        )
        // Use local state for immediate responsiveness - this is the key optimization
        const assignedJobs = jobsWithFoodDeliveryNeeds.filter(
          ({ job }) => jobCourierAssignments.get(job.id) === courierNumber
        )

        // Filter out jobs that are being removed for client-side ordering
        const activeJobs = assignedJobs.filter(
          ({ job }) => !removingJobIds.has(job.id)
        )

        // Sort jobs by their order in the delivery, but fall back to local assignment order for new assignments
        const orderedJobs = activeJobs.sort((a, b) => {
          const orderA =
            delivery?.jobs.find(j => j.activeJobId === a.job.id)?.order || 999
          const orderB =
            delivery?.jobs.find(j => j.activeJobId === b.job.id)?.order || 999
          return orderA - orderB
        })

        // Add client-side order numbers for immediate UI feedback
        const jobsWithClientOrder = orderedJobs.map((jobData, index) => ({
          ...jobData,
          clientOrder: index + 1, // Sequential numbering starting from 1
        }))

        return {
          courierNumber,
          jobs: jobsWithClientOrder,
        }
      })
      .filter(
        courier =>
          // Only show couriers that exist in the database OR have jobs assigned locally
          savedCourierNumbers.has(courier.courierNumber) ||
          courier.jobs.length > 0
      )
  }, [
    foodDeliveries,
    jobsWithFoodDeliveryNeeds,
    jobCourierAssignments,
    removingJobIds,
  ])

  // Helper function to get allergens for a specific job
  const getJobAllergens = useCallback((job: ActiveJobNoPlan) => {
    const allergenSet = new Set<string>()

    job.workers.forEach(worker => {
      worker.foodAllergies.forEach(allergy => {
        allergenSet.add(allergy.name)
      })
    })

    return Array.from(allergenSet).sort()
  }, [])

  const unassignedJobs = useMemo(() => {
    return jobsWithFoodDeliveryNeeds.filter(
      ({ job }) => !jobCourierAssignments.has(job.id)
    )
  }, [jobsWithFoodDeliveryNeeds, jobCourierAssignments])

  // Get jobs that have workers with allergies (for map display)
  const selectedJobsForMap = useMemo(() => {
    if (!planData) return []
    return planData.jobs.filter(
      job =>
        selectedJobIds.has(job.id) &&
        jobsWithFoodDeliveryNeeds.some(
          deliveryJob => deliveryJob.job.id === job.id
        )
    )
  }, [planData, selectedJobIds, jobsWithFoodDeliveryNeeds])

  if (error && !planData) {
    return <ErrorPage error={error} />
  }

  return (
    <>
      {planData === null && <ErrorPage404 message="Plán nenalezen." />}
      {planData !== null && (
        <>
          <PageHeader
            title={`Rozvoz jídla - ${planData ? formatDateLong(planData.day) : 'Načítání...'}`}
          >
            <Link href={`/plans/${planId}`}>
              <button className="btn btn-secondary btn-with-icon" type="button">
                <i className="fas fa-arrow-left"></i>
                <span>Zpět na plán</span>
              </button>
            </Link>
            {selectedJobIds.size > 0 && (
              <button
                className="btn btn-info btn-with-icon"
                type="button"
                onClick={() => setShowJobMap(!showJobMap)}
              >
                <i className="fas fa-map"></i>
                <span>
                  {showJobMap
                    ? 'Skrýt mapu'
                    : `Zobrazit mapu (${selectedJobIds.size})`}
                </span>
              </button>
            )}
            {selectedJobIds.size > 0 && (
              <button
                className="btn btn-outline-secondary btn-with-icon"
                type="button"
                onClick={clearJobSelection}
              >
                <i className="fas fa-times"></i>
                <span>Zrušit výběr</span>
              </button>
            )}
            <button
              className="btn btn-warning btn-with-icon"
              type="button"
              onClick={() => setShowCourierAssignment(!showCourierAssignment)}
            >
              <i className="fas fa-truck"></i>
              <span>
                {showCourierAssignment
                  ? 'Skrýt rozvozníky'
                  : 'Spravovat rozvozníky'}
              </span>
            </button>
          </PageHeader>

          <section>
            <div className="container-fluid">
              {/* Display save/error messages */}
              {saveMessage && (
                <div className="row mb-4">
                  <div className="col">
                    <div
                      className={`alert ${saveMessageType === 'success' ? 'alert-success' : 'alert-danger'} alert-dismissible fade show`}
                    >
                      <i
                        className={`fas ${saveMessageType === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'} me-2`}
                      ></i>
                      {saveMessage}
                      <button
                        type="button"
                        className="btn-close"
                        onClick={() => setSaveMessage(null)}
                        aria-label="Close"
                      ></button>
                    </div>
                  </div>
                </div>
              )}

              {/* Display food delivery loading error */}
              {foodDeliveriesError && (
                <div className="row mb-4">
                  <div className="col">
                    <div className="alert alert-danger">
                      <i className="fas fa-exclamation-triangle me-2"></i>
                      <strong>
                        Chyba při načítání uložených rozvozních entit:
                      </strong>
                      <br />
                      {foodDeliveriesError.message || 'Neznámá chyba'}
                    </div>
                  </div>
                </div>
              )}

              {jobsWithFoodDeliveryNeeds.length === 0 ? (
                <div className="text-center p-5">
                  <div className="alert alert-info">
                    <i className="fas fa-info-circle me-2"></i>
                    Všechny joby mají jídlo na místě a žádní pracanti nemají
                    potravinové alergie.
                  </div>
                </div>
              ) : (
                <>
                  <div className="row mb-4">
                    <div className="col">
                      <div className="alert alert-warning">
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        <strong>
                          Celkem {jobsWithFoodDeliveryNeeds.length} jobů s
                          dovozem jídla
                        </strong>
                        <br />
                        Joby buď nemají jídlo na místě, nebo mají pracanty s
                        potravinovými alergiemi.
                      </div>
                    </div>
                  </div>

                  {showCourierAssignment && (
                    <div className="row mb-4">
                      <div className="col">
                        <div className="card border-warning">
                          <div className="card-header bg-warning">
                            <div className="d-flex justify-content-between align-items-center">
                              <h5 className="card-title mb-0 text-dark">
                                <i className="fas fa-truck me-2"></i>
                                Správa rozvozníků
                              </h5>
                              <div className="d-flex gap-2">
                                <button
                                  className="btn btn-sm btn-success"
                                  type="button"
                                  onClick={addNewCourier}
                                  disabled={isOperationLoading}
                                >
                                  <i className="fas fa-plus me-1"></i>
                                  Přidat rozvozníka
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  type="button"
                                  onClick={clearAllAssignments}
                                  disabled={
                                    jobCourierAssignments.size === 0 ||
                                    removingJobIds.size > 0 ||
                                    pendingOperations.size > 0
                                  }
                                >
                                  {removingJobIds.size > 0 ? (
                                    <>
                                      <i className="fas fa-spinner fa-spin me-1"></i>
                                      Odebírám...
                                    </>
                                  ) : pendingOperations.size > 0 ? (
                                    <>
                                      <i className="fas fa-clock me-1"></i>
                                      Čekám na dokončení...
                                    </>
                                  ) : (
                                    <>
                                      <i className="fas fa-trash-alt me-1"></i>
                                      Vymazat vše
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="card-body">
                            <div className="mb-3 text-muted">
                              <span>
                                {jobCourierAssignments.size} z{' '}
                                {jobsWithFoodDeliveryNeeds.length} jobů
                                přiřazeno
                              </span>
                              {jobsByCourier.length > 0 && (
                                <span className="ms-3">
                                  • {jobsByCourier.length} aktivní rozvozník
                                  {jobsByCourier.length === 1 ? '' : 'ů'}
                                </span>
                              )}
                              {hasPendingChanges && (
                                <span className="ms-3 text-warning">
                                  <i className="fas fa-clock me-1"></i>
                                  Ukládám změny...
                                </span>
                              )}
                              {pendingOperations.size > 0 && (
                                <span className="ms-3 text-info">
                                  <i className="fas fa-sync fa-spin me-1"></i>
                                  {pendingOperations.size} operací v běhu
                                </span>
                              )}
                            </div>

                            {foodDeliveries === undefined ? (
                              <div className="text-center py-4">
                                <i className="fas fa-spinner fa-spin me-2"></i>
                                Načítání rozvozníků...
                              </div>
                            ) : jobsByCourier.length > 0 ? (
                              <div className="row">
                                <div className="col">
                                  <h6 className="mb-3">
                                    <i className="fas fa-list me-2"></i>
                                    Rozvozníci a jejich joby:
                                  </h6>
                                  <div className="row">
                                    {jobsByCourier.map(
                                      ({ courierNumber, jobs }) => (
                                        <div
                                          key={courierNumber}
                                          className="col-md-6 col-lg-4 mb-3"
                                        >
                                          <div className="card border-primary courier-card">
                                            <div className="card-header bg-primary text-white">
                                              <div className="d-flex justify-content-between align-items-center">
                                                <div>
                                                  <h6 className="card-title mb-0">
                                                    <i className="fas fa-user me-2"></i>
                                                    Rozvozník {courierNumber}
                                                  </h6>
                                                  <small>
                                                    {jobs.length} job
                                                    {jobs.length === 1
                                                      ? ''
                                                      : 'ů'}
                                                    {(() => {
                                                      const removingCount =
                                                        jobs.filter(({ job }) =>
                                                          removingJobIds.has(
                                                            job.id
                                                          )
                                                        ).length
                                                      return removingCount >
                                                        0 ? (
                                                        <span className="text-warning ms-2">
                                                          <i className="fas fa-spinner fa-spin me-1"></i>
                                                          (odebírám{' '}
                                                          {removingCount})
                                                        </span>
                                                      ) : null
                                                    })()}
                                                  </small>
                                                </div>
                                                <div className="btn-group">
                                                  <Link
                                                    href={`/plan/${planId}/courier/${foodDeliveries?.find(d => d.courierNum === courierNumber)?.id}`}
                                                  >
                                                    <button
                                                      className="btn btn-sm btn-outline-light"
                                                      title="Otevřít pohled rozvozníka"
                                                    >
                                                      <i className="fas fa-eye"></i>
                                                    </button>
                                                  </Link>
                                                  <button
                                                    className="btn btn-sm btn-outline-light"
                                                    onClick={() =>
                                                      toggleCourierMap(
                                                        courierNumber
                                                      )
                                                    }
                                                    disabled={jobs.length === 0}
                                                    title="Zobrazit/skrýt mapu jobů"
                                                  >
                                                    <i
                                                      className={`fas fa-map${showCourierMap[courierNumber] ? '-marked-alt' : ''}`}
                                                    ></i>
                                                  </button>
                                                  <button
                                                    className="btn btn-sm btn-outline-light"
                                                    onClick={() =>
                                                      removeCourier(
                                                        courierNumber
                                                      )
                                                    }
                                                    disabled={
                                                      isOperationLoading
                                                    }
                                                    title="Odstranit rozvozníka a jeho přiřazení"
                                                  >
                                                    <i className="fas fa-trash"></i>
                                                  </button>
                                                </div>
                                              </div>
                                            </div>
                                            <div className="card-body p-2">
                                              {jobs.length === 0 ? (
                                                <div className="text-center text-muted py-2">
                                                  <i className="fas fa-inbox me-1"></i>
                                                  Žádné joby
                                                </div>
                                              ) : (
                                                <div className="list-group list-group-flush">
                                                  {' '}
                                                  {jobs.map(
                                                    (
                                                      { job, clientOrder },
                                                      jobIndex
                                                    ) => {
                                                      const jobAllergens =
                                                        getJobAllergens(job)
                                                      const delivery =
                                                        foodDeliveries?.find(
                                                          d =>
                                                            d.courierNum ===
                                                            courierNumber
                                                        )
                                                      // Use client-side order for immediate feedback, fall back to database order
                                                      const jobOrder =
                                                        clientOrder ||
                                                        delivery?.jobs.find(
                                                          j =>
                                                            j.activeJobId ===
                                                            job.id
                                                        )?.order ||
                                                        jobIndex + 1
                                                      const isBeingRemoved =
                                                        removingJobIds.has(
                                                          job.id
                                                        )
                                                      const isPending =
                                                        pendingOperations.has(
                                                          job.id
                                                        )

                                                      return (
                                                        <div
                                                          key={job.id}
                                                          className={`list-group-item px-2 py-2 courier-job-item${isBeingRemoved ? ' removing-job' : ''}${isPending ? ' pending-job' : ''}`}
                                                          style={
                                                            isBeingRemoved
                                                              ? {
                                                                  opacity: 0.6,
                                                                  backgroundColor:
                                                                    '#fff2f2',
                                                                  transition:
                                                                    'all 0.3s ease-in-out',
                                                                  border:
                                                                    '2px dashed #dc3545',
                                                                  position:
                                                                    'relative',
                                                                }
                                                              : isPending
                                                                ? {
                                                                    backgroundColor:
                                                                      '#f8f9fa',
                                                                    transition:
                                                                      'all 0.2s ease-in-out',
                                                                    border:
                                                                      '1px solid #6c757d',
                                                                  }
                                                                : {}
                                                          }
                                                        >
                                                          <div className="d-flex justify-content-between align-items-start mb-2">
                                                            <div className="flex-grow-1 me-2">
                                                              <div className="d-flex align-items-center mb-1">
                                                                <span className="badge bg-secondary me-2 job-order-badge">
                                                                  {jobOrder}
                                                                </span>
                                                                <small className="fw-bold">
                                                                  {
                                                                    job
                                                                      .proposedJob
                                                                      .name
                                                                  }
                                                                </small>
                                                                {isBeingRemoved && (
                                                                  <span className="badge bg-danger ms-2 animate-pulse">
                                                                    <i className="fas fa-spinner fa-spin me-1"></i>
                                                                    Odebírám
                                                                  </span>
                                                                )}
                                                              </div>
                                                              <div className="small text-muted mb-1">
                                                                <i className="fas fa-map-marker-alt me-1"></i>
                                                                {job.proposedJob
                                                                  .area?.name ||
                                                                  'Nezadaná oblast'}
                                                              </div>
                                                              <div className="small text-muted mb-1">
                                                                <i className="fas fa-home me-1"></i>
                                                                {job.proposedJob
                                                                  .address ||
                                                                  'Nezadaná adresa'}
                                                              </div>
                                                              {jobAllergens.length >
                                                                0 && (
                                                                <div className="mb-1">
                                                                  <div className="small text-muted mb-1">
                                                                    Pracanti s
                                                                    alergiemi:
                                                                  </div>
                                                                  <div className="d-flex flex-wrap gap-1">
                                                                    {job.workers
                                                                      .filter(
                                                                        worker =>
                                                                          worker
                                                                            .foodAllergies
                                                                            .length >
                                                                          0
                                                                      )
                                                                      .map(
                                                                        (
                                                                          worker,
                                                                          workerIndex
                                                                        ) => (
                                                                          <div
                                                                            key={`${worker.id}-${workerIndex}`}
                                                                            className="worker-allergies-box"
                                                                          >
                                                                            <div className="small fw-bold text-dark">
                                                                              {
                                                                                worker.firstName
                                                                              }{' '}
                                                                              {
                                                                                worker.lastName
                                                                              }
                                                                            </div>
                                                                            <div className="d-flex flex-wrap gap-1 mt-1">
                                                                              {worker.foodAllergies.map(
                                                                                (
                                                                                  allergy,
                                                                                  allergyIndex
                                                                                ) => (
                                                                                  <span
                                                                                    key={
                                                                                      allergyIndex
                                                                                    }
                                                                                    className="badge bg-danger allergen-badge"
                                                                                  >
                                                                                    {
                                                                                      allergy.name
                                                                                    }
                                                                                  </span>
                                                                                )
                                                                              )}
                                                                            </div>
                                                                          </div>
                                                                        )
                                                                      )}
                                                                  </div>
                                                                </div>
                                                              )}
                                                              {/* Show meal count information */}
                                                              <div className="small text-muted">
                                                                <i className="fas fa-utensils me-1"></i>
                                                                {(() => {
                                                                  const allergicWorkers =
                                                                    job.workers.filter(
                                                                      w =>
                                                                        w
                                                                          .foodAllergies
                                                                          .length >
                                                                        0
                                                                    ).length
                                                                  const totalWorkers =
                                                                    job.workers
                                                                      .length
                                                                  const nonAllergicWorkers =
                                                                    totalWorkers -
                                                                    allergicWorkers

                                                                  if (
                                                                    !job
                                                                      .proposedJob
                                                                      .hasFood
                                                                  ) {
                                                                    // No food on site - need meals for everyone
                                                                    return `${allergicWorkers} bezalergenních, ${nonAllergicWorkers} běžných jídel`
                                                                  } else {
                                                                    // Food on site - only allergic workers need special meals
                                                                    return `${allergicWorkers} bezalergenních jídel (jídlo na místě pro ostatní)`
                                                                  }
                                                                })()}
                                                              </div>
                                                            </div>
                                                            <div className="d-flex flex-column gap-1">
                                                              <div
                                                                className="btn-group-vertical"
                                                                role="group"
                                                              >
                                                                <button
                                                                  className="btn btn-outline-secondary btn-sm reorder-btn"
                                                                  onClick={() =>
                                                                    reorderJobInCourier(
                                                                      courierNumber,
                                                                      job.id,
                                                                      'up'
                                                                    )
                                                                  }
                                                                  disabled={
                                                                    jobIndex ===
                                                                      0 ||
                                                                    isOperationLoading ||
                                                                    isBeingRemoved ||
                                                                    isPending ||
                                                                    hasPendingChanges
                                                                  }
                                                                  title="Posunout nahoru v pořadí"
                                                                  style={{
                                                                    fontSize:
                                                                      '0.7em',
                                                                    padding:
                                                                      '0.2rem 0.4rem',
                                                                  }}
                                                                >
                                                                  <i className="fas fa-chevron-up"></i>
                                                                </button>
                                                                <button
                                                                  className="btn btn-outline-secondary btn-sm reorder-btn"
                                                                  onClick={() =>
                                                                    reorderJobInCourier(
                                                                      courierNumber,
                                                                      job.id,
                                                                      'down'
                                                                    )
                                                                  }
                                                                  disabled={
                                                                    jobIndex ===
                                                                      jobs.length -
                                                                        1 ||
                                                                    isOperationLoading ||
                                                                    isBeingRemoved ||
                                                                    isPending ||
                                                                    hasPendingChanges
                                                                  }
                                                                  title="Posunout dolů v pořadí"
                                                                  style={{
                                                                    fontSize:
                                                                      '0.7em',
                                                                    padding:
                                                                      '0.2rem 0.4rem',
                                                                  }}
                                                                >
                                                                  <i className="fas fa-chevron-down"></i>
                                                                </button>
                                                              </div>
                                                              <button
                                                                className={`btn btn-sm ${isBeingRemoved ? 'btn-danger' : 'btn-outline-danger'}`}
                                                                onClick={() =>
                                                                  unassignJob(
                                                                    job.id
                                                                  )
                                                                }
                                                                disabled={
                                                                  isBeingRemoved ||
                                                                  isOperationLoading ||
                                                                  isPending
                                                                }
                                                                title={
                                                                  isBeingRemoved
                                                                    ? 'Odebírám...'
                                                                    : isPending
                                                                      ? 'Zpracovávám...'
                                                                      : 'Odebrat přiřazení'
                                                                }
                                                                style={{
                                                                  fontSize:
                                                                    '0.7em',
                                                                  padding:
                                                                    '0.2rem 0.4rem',
                                                                }}
                                                              >
                                                                {isBeingRemoved ? (
                                                                  <i className="fas fa-spinner fa-spin"></i>
                                                                ) : isPending ? (
                                                                  <i className="fas fa-clock"></i>
                                                                ) : (
                                                                  <i className="fas fa-times"></i>
                                                                )}
                                                              </button>
                                                            </div>
                                                          </div>
                                                        </div>
                                                      )
                                                    }
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                            {showCourierMap[courierNumber] &&
                                              jobs.length > 0 &&
                                              planData && (
                                                <div className="card-footer">
                                                  <h6 className="mb-2">
                                                    <i className="fas fa-map me-2"></i>
                                                    Mapa jobů rozvozníka{' '}
                                                    {courierNumber}
                                                  </h6>
                                                  <div
                                                    style={{ height: '400px' }}
                                                  >
                                                    {(() => {
                                                      // Create job order mapping for this courier
                                                      const delivery =
                                                        foodDeliveries?.find(
                                                          d =>
                                                            d.courierNum ===
                                                            courierNumber
                                                        )
                                                      const jobOrder: {
                                                        [jobId: string]: number
                                                      } = {}
                                                      if (delivery) {
                                                        delivery.jobs.forEach(
                                                          jobOrder_item => {
                                                            jobOrder[
                                                              jobOrder_item.activeJobId
                                                            ] =
                                                              jobOrder_item.order
                                                          }
                                                        )
                                                      }

                                                      return (
                                                        <JobsMapView
                                                          jobs={planData.jobs.filter(
                                                            job =>
                                                              jobs.some(
                                                                courierJob =>
                                                                  courierJob.job
                                                                    .id ===
                                                                  job.id
                                                              )
                                                          )}
                                                          jobOrder={jobOrder}
                                                        />
                                                      )
                                                    })()}
                                                  </div>
                                                </div>
                                              )}
                                          </div>
                                        </div>
                                      )
                                    )}
                                  </div>

                                  {unassignedJobs.length > 0 && (
                                    <div className="mt-3">
                                      <h6 className="mb-2">
                                        <i className="fas fa-question-circle me-2"></i>
                                        Nepřiřazené joby (
                                        {unassignedJobs.length}):
                                      </h6>
                                      <div className="card border-secondary">
                                        <div className="card-body p-2">
                                          <div className="list-group list-group-flush">
                                            {unassignedJobs.map(({ job }) => {
                                              const jobAllergens =
                                                getJobAllergens(job)

                                              return (
                                                <div
                                                  key={job.id}
                                                  className="list-group-item px-2 py-2 d-flex justify-content-between align-items-start"
                                                >
                                                  <div className="flex-grow-1 me-3">
                                                    <strong>
                                                      {job.proposedJob.name}
                                                    </strong>
                                                    <br />
                                                    <small className="text-muted">
                                                      <i className="fas fa-map-marker-alt me-1"></i>
                                                      {job.proposedJob.area
                                                        ?.name ||
                                                        'Nezadaná oblast'}
                                                    </small>
                                                    <br />
                                                    <small className="text-muted">
                                                      <i className="fas fa-home me-1"></i>
                                                      {job.proposedJob
                                                        .address ||
                                                        'Nezadaná adresa'}
                                                    </small>
                                                    {jobAllergens.length >
                                                      0 && (
                                                      <div className="mt-1">
                                                        <div className="small text-muted">
                                                          Alergie:
                                                        </div>{' '}
                                                        {(() => {
                                                          const workersWithAllergies =
                                                            job.workers
                                                              .filter(
                                                                worker =>
                                                                  worker
                                                                    .foodAllergies
                                                                    .length > 0
                                                              )
                                                              .map(worker => ({
                                                                id: worker.id,
                                                                firstName:
                                                                  worker.firstName,
                                                                lastName:
                                                                  worker.lastName,
                                                                allergies:
                                                                  worker.foodAllergies.map(
                                                                    allergy =>
                                                                      allergy.name
                                                                  ),
                                                              }))

                                                          return (
                                                            <div className="d-flex flex-wrap gap-1">
                                                              {workersWithAllergies.map(
                                                                worker => (
                                                                  <div
                                                                    key={
                                                                      worker.id
                                                                    }
                                                                    className="border rounded p-1 bg-light worker-allergy-box"
                                                                  >
                                                                    <div className="small fw-bold text-dark mb-1">
                                                                      {
                                                                        worker.firstName
                                                                      }{' '}
                                                                      {
                                                                        worker.lastName
                                                                      }
                                                                    </div>
                                                                    <div className="d-flex flex-wrap gap-1">
                                                                      {worker.allergies.map(
                                                                        (
                                                                          allergen,
                                                                          allergenIndex
                                                                        ) => (
                                                                          <span
                                                                            key={
                                                                              allergenIndex
                                                                            }
                                                                            className="badge bg-danger allergen-badge"
                                                                          >
                                                                            {
                                                                              allergen
                                                                            }
                                                                          </span>
                                                                        )
                                                                      )}
                                                                    </div>
                                                                  </div>
                                                                )
                                                              )}
                                                            </div>
                                                          )
                                                        })()}
                                                      </div>
                                                    )}
                                                  </div>
                                                  <div
                                                    className="btn-group"
                                                    role="group"
                                                  >
                                                    {jobsByCourier.map(
                                                      ({ courierNumber }) => (
                                                        <button
                                                          key={courierNumber}
                                                          className="btn btn-sm btn-outline-primary"
                                                          onClick={() =>
                                                            assignJobToCourier(
                                                              job.id,
                                                              courierNumber
                                                            )
                                                          }
                                                          disabled={
                                                            isSaving ||
                                                            isOperationLoading ||
                                                            pendingOperations.has(
                                                              job.id
                                                            ) ||
                                                            hasPendingChanges
                                                          }
                                                          title={`Přiřadit rozvozníkovi ${courierNumber}`}
                                                        >
                                                          {isSaving ||
                                                          pendingOperations.has(
                                                            job.id
                                                          ) ? (
                                                            <i className="fas fa-spinner fa-spin"></i>
                                                          ) : (
                                                            courierNumber
                                                          )}
                                                        </button>
                                                      )
                                                    )}
                                                  </div>
                                                </div>
                                              )
                                            })}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-4">
                                <div className="text-muted">
                                  <i className="fas fa-plus-circle me-2"></i>
                                  Žádní rozvozníci nejsou vytvoření.
                                </div>
                                <div className="text-muted small mt-1">
                                  Použijte tlačítko &quot;Přidat
                                  rozvozníka&quot; pro vytvoření nového
                                  rozvozníka.
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Statistics section - always visible when there are courier assignments */}
                  {jobsByCourier.length > 0 &&
                    jobCourierAssignments.size > 0 && (
                      <div className="row mb-4">
                        <div className="col">
                          <div className="card border-info">
                            <div className="card-header bg-info text-white">
                              <h6 className="card-title mb-0">
                                <i className="fas fa-chart-pie me-2"></i>
                                Statistiky rovozu jídel
                              </h6>
                            </div>
                            <div className="card-body">
                              <div className="row text-center">
                                {jobsByCourier.map(
                                  ({ courierNumber, jobs }) => {
                                    // Calculate meal requirements:
                                    // - If job has food: only allergic workers need allergen-free meals
                                    // - If job has no food: allergic workers need allergen-free, others need standard meals
                                    let allergenFreeMeals = 0
                                    let standardMeals = 0

                                    jobs.forEach(
                                      ({
                                        job,
                                        workersWithAllergies,
                                        needsFoodDelivery,
                                      }) => {
                                        const allergicWorkersCount =
                                          workersWithAllergies.length
                                        const totalWorkersCount =
                                          job.workers.length
                                        const nonAllergicWorkersCount =
                                          totalWorkersCount -
                                          allergicWorkersCount

                                        if (needsFoodDelivery) {
                                          // Job has no food - need meals for everyone
                                          allergenFreeMeals +=
                                            allergicWorkersCount
                                          standardMeals +=
                                            nonAllergicWorkersCount
                                        } else {
                                          // Job has food - only allergic workers need special meals
                                          allergenFreeMeals +=
                                            allergicWorkersCount
                                        }
                                      }
                                    )

                                    return (
                                      <div key={courierNumber} className="col">
                                        <div className="border rounded p-2">
                                          <div className="h4 mb-1 text-primary">
                                            {jobs.length}
                                          </div>
                                          <div className="small text-muted mb-1">
                                            Rozvozník {courierNumber}
                                          </div>
                                          <div className="small">
                                            <div className="text-danger">
                                              <i className="fas fa-apple-alt me-1"></i>
                                              Jídla pro alergiky:{' '}
                                              {allergenFreeMeals}
                                            </div>
                                            <div className="text-success">
                                              <i className="fas fa-utensils me-1"></i>
                                              Běžná jídla: {standardMeals}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  }
                                )}
                                <div className="col">
                                  <div className="border rounded p-2 border-warning">
                                    <div className="h4 mb-1 text-warning">
                                      {unassignedJobs.length}
                                    </div>
                                    <div className="small text-muted mb-1">
                                      Nepřiřazeno
                                    </div>
                                    <div className="small">
                                      {(() => {
                                        // Calculate meal requirements for unassigned jobs
                                        let allergenFreeMeals = 0
                                        let standardMeals = 0

                                        unassignedJobs.forEach(
                                          ({
                                            job,
                                            workersWithAllergies,
                                            needsFoodDelivery,
                                          }) => {
                                            const allergicWorkersCount =
                                              workersWithAllergies.length
                                            const totalWorkersCount =
                                              job.workers.length
                                            const nonAllergicWorkersCount =
                                              totalWorkersCount -
                                              allergicWorkersCount

                                            if (needsFoodDelivery) {
                                              // Job has no food - need meals for everyone
                                              allergenFreeMeals +=
                                                allergicWorkersCount
                                              standardMeals +=
                                                nonAllergicWorkersCount
                                            } else {
                                              // Job has food - only allergic workers need special meals
                                              allergenFreeMeals +=
                                                allergicWorkersCount
                                            }
                                          }
                                        )

                                        return (
                                          <>
                                            <div className="text-danger">
                                              <i className="fas fa-apple-alt me-1"></i>
                                              Jídla pro alergiky:{' '}
                                              {allergenFreeMeals}
                                            </div>
                                            <div className="text-success">
                                              <i className="fas fa-utensils me-1"></i>
                                              Běžná jídla: {standardMeals}
                                            </div>
                                          </>
                                        )
                                      })()}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                  <div className="row mb-4">
                    <div className="col">
                      <div className="card">
                        <div className="card-header">
                          <h5 className="card-title mb-0">
                            <i className="fas fa-utensils me-2"></i>
                            Joby s dovozem jídla
                          </h5>
                        </div>
                        <div className="card-body">
                          {jobsWithFoodDeliveryNeeds.map(
                            ({
                              job,
                              workersWithAllergies,
                              needsFoodDelivery,
                              hasWorkersWithAllergies,
                            }) => (
                              <div key={job.id} className="mb-4">
                                <div className="card border-info">
                                  <div className="card-header bg-light">
                                    <div className="d-flex align-items-center">
                                      <input
                                        type="checkbox"
                                        checked={selectedJobIds.has(job.id)}
                                        onChange={() =>
                                          toggleJobSelection(job.id)
                                        }
                                        className="form-check-input me-3"
                                        style={{ transform: 'scale(1.3)' }}
                                      />
                                      <div className="flex-grow-1">
                                        <h6 className="mb-2">
                                          <strong>
                                            {job.proposedJob.name}
                                          </strong>
                                          <div className="d-flex flex-wrap gap-2 mt-1">
                                            {job.completed && (
                                              <span className="badge bg-success">
                                                Hotovo
                                              </span>
                                            )}
                                            {jobCourierAssignments.has(
                                              job.id
                                            ) && (
                                              <span className="badge bg-primary">
                                                <i className="fas fa-truck me-1"></i>
                                                Rozvozník{' '}
                                                {jobCourierAssignments.get(
                                                  job.id
                                                )}
                                              </span>
                                            )}
                                          </div>
                                        </h6>
                                        <div className="d-flex flex-column flex-lg-row gap-2 gap-lg-3 text-muted small">
                                          <span>
                                            <i className="fas fa-map-marker-alt me-1"></i>
                                            {job.proposedJob.area?.name ||
                                              'Nezadaná oblast'}
                                          </span>
                                          <span>
                                            <i className="fas fa-home me-1"></i>
                                            {job.proposedJob.address}
                                          </span>
                                          {job.responsibleWorker && (
                                            <div className="d-flex flex-column flex-sm-row gap-1 gap-sm-2">
                                              <span>
                                                <i className="fas fa-user-tie me-1"></i>
                                                Vedoucí:{' '}
                                                <strong>
                                                  {
                                                    job.responsibleWorker
                                                      .firstName
                                                  }{' '}
                                                  {
                                                    job.responsibleWorker
                                                      .lastName
                                                  }
                                                </strong>
                                              </span>
                                              <a
                                                href={`tel:${job.responsibleWorker.phone}`}
                                                className="text-decoration-none"
                                              >
                                                <i className="fas fa-phone me-1"></i>
                                                {job.responsibleWorker.phone}
                                              </a>
                                            </div>
                                          )}
                                        </div>
                                        <div className="d-flex flex-wrap gap-2 mt-2">
                                          {needsFoodDelivery && (
                                            <span className="badge bg-warning text-dark">
                                              <i className="fas fa-utensils me-1"></i>
                                              Nemá jídlo na místě (
                                              {job.workers.length -
                                                workersWithAllergies.length}{' '}
                                              pracant
                                              {job.workers.length -
                                                workersWithAllergies.length ===
                                              1
                                                ? ''
                                                : 'ů'}
                                              )
                                            </span>
                                          )}
                                          {hasWorkersWithAllergies && (
                                            <span className="badge bg-danger">
                                              <i className="fas fa-exclamation-triangle me-1"></i>
                                              {workersWithAllergies.length}{' '}
                                              pracant
                                              {workersWithAllergies.length === 1
                                                ? ''
                                                : 'ů'}{' '}
                                              s alergiemi
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      {showCourierAssignment &&
                                        jobsByCourier.length > 0 && (
                                          <div className="ms-2 d-none d-md-block">
                                            <div
                                              className="btn-group-vertical"
                                              role="group"
                                            >
                                              <small className="text-muted mb-1">
                                                Přiřadit:
                                              </small>
                                              <div
                                                className="btn-group"
                                                role="group"
                                              >
                                                {jobsByCourier.map(
                                                  ({ courierNumber }) => (
                                                    <button
                                                      key={courierNumber}
                                                      className={`btn btn-sm ${
                                                        jobCourierAssignments.get(
                                                          job.id
                                                        ) === courierNumber
                                                          ? 'btn-primary'
                                                          : 'btn-outline-primary'
                                                      }`}
                                                      onClick={() =>
                                                        jobCourierAssignments.get(
                                                          job.id
                                                        ) === courierNumber
                                                          ? unassignJob(job.id)
                                                          : assignJobToCourier(
                                                              job.id,
                                                              courierNumber
                                                            )
                                                      }
                                                      disabled={
                                                        isSaving ||
                                                        isOperationLoading ||
                                                        pendingOperations.has(
                                                          job.id
                                                        ) ||
                                                        hasPendingChanges
                                                      }
                                                      title={`${
                                                        jobCourierAssignments.get(
                                                          job.id
                                                        ) === courierNumber
                                                          ? 'Odebrat z'
                                                          : 'Přiřadit'
                                                      } rozvozníka ${courierNumber}`}
                                                    >
                                                      {(isSaving ||
                                                        pendingOperations.has(
                                                          job.id
                                                        )) &&
                                                      jobCourierAssignments.get(
                                                        job.id
                                                      ) === courierNumber ? (
                                                        <i className="fas fa-spinner fa-spin"></i>
                                                      ) : (
                                                        courierNumber
                                                      )}
                                                    </button>
                                                  )
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                    </div>
                                    {/* Mobile courier assignment buttons */}
                                    {showCourierAssignment &&
                                      jobsByCourier.length > 0 && (
                                        <div className="d-md-none mt-2 pt-2 border-top">
                                          <small className="text-muted">
                                            Přiřadit rozvozníka:
                                          </small>
                                          <div className="d-flex flex-wrap gap-1 mt-1">
                                            {jobsByCourier.map(
                                              ({ courierNumber }) => (
                                                <button
                                                  key={courierNumber}
                                                  className={`btn btn-sm ${
                                                    jobCourierAssignments.get(
                                                      job.id
                                                    ) === courierNumber
                                                      ? 'btn-primary'
                                                      : 'btn-outline-primary'
                                                  }`}
                                                  onClick={() =>
                                                    jobCourierAssignments.get(
                                                      job.id
                                                    ) === courierNumber
                                                      ? unassignJob(job.id)
                                                      : assignJobToCourier(
                                                          job.id,
                                                          courierNumber
                                                        )
                                                  }
                                                  disabled={
                                                    isSaving ||
                                                    isOperationLoading ||
                                                    pendingOperations.has(
                                                      job.id
                                                    ) ||
                                                    hasPendingChanges
                                                  }
                                                  title={`${
                                                    jobCourierAssignments.get(
                                                      job.id
                                                    ) === courierNumber
                                                      ? 'Odebrat z'
                                                      : 'Přiřadit'
                                                  } rozvozníka ${courierNumber}`}
                                                >
                                                  {(isSaving ||
                                                    pendingOperations.has(
                                                      job.id
                                                    )) &&
                                                  jobCourierAssignments.get(
                                                    job.id
                                                  ) === courierNumber ? (
                                                    <i className="fas fa-spinner fa-spin"></i>
                                                  ) : (
                                                    `Rozvozník ${courierNumber}`
                                                  )}
                                                </button>
                                              )
                                            )}
                                          </div>
                                        </div>
                                      )}
                                  </div>
                                  <div className="card-body">
                                    {workersWithAllergies.length > 0 ? (
                                      <div className="table-responsive">
                                        <table className="table table-sm mb-0">
                                          <thead>
                                            <tr>
                                              <th
                                                className="d-none d-md-table-cell"
                                                style={{ width: '35%' }}
                                              >
                                                Pracant
                                              </th>
                                              <th
                                                className="d-none d-md-table-cell"
                                                style={{ width: '30%' }}
                                              >
                                                Telefon
                                              </th>
                                              <th
                                                className="d-none d-md-table-cell"
                                                style={{ width: '35%' }}
                                              >
                                                Alergie
                                              </th>
                                              <th className="d-md-none">
                                                Pracanti s alergiemi
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {workersWithAllergies.map(
                                              (worker, index) => (
                                                <tr
                                                  key={`${worker.id}-${index}`}
                                                >
                                                  {/* Desktop layout */}
                                                  <td className="d-none d-md-table-cell">
                                                    <strong>
                                                      {worker.firstName}{' '}
                                                      {worker.lastName}
                                                    </strong>
                                                  </td>
                                                  <td className="d-none d-md-table-cell">
                                                    <a
                                                      href={`tel:${worker.phone}`}
                                                      className="text-decoration-none"
                                                    >
                                                      <i className="fas fa-phone me-1"></i>
                                                      {worker.phone}
                                                    </a>
                                                  </td>
                                                  <td className="d-none d-md-table-cell">
                                                    <div className="d-flex flex-wrap gap-1">
                                                      {worker.allergies.map(
                                                        (
                                                          allergy,
                                                          allergyIndex
                                                        ) => (
                                                          <span
                                                            key={allergyIndex}
                                                            className="badge bg-danger text-white"
                                                            style={{
                                                              fontSize:
                                                                '0.75rem',
                                                            }}
                                                          >
                                                            {allergy}
                                                          </span>
                                                        )
                                                      )}
                                                    </div>
                                                  </td>
                                                  {/* Mobile layout */}
                                                  <td className="d-md-none">
                                                    <div className="mb-2">
                                                      <strong>
                                                        {worker.firstName}{' '}
                                                        {worker.lastName}
                                                      </strong>
                                                      <br />
                                                      <a
                                                        href={`tel:${worker.phone}`}
                                                        className="text-decoration-none text-muted"
                                                      >
                                                        <i className="fas fa-phone me-1"></i>
                                                        {worker.phone}
                                                      </a>
                                                    </div>
                                                    <div className="d-flex flex-wrap gap-1">
                                                      {worker.allergies.map(
                                                        (
                                                          allergy,
                                                          allergyIndex
                                                        ) => (
                                                          <span
                                                            key={allergyIndex}
                                                            className="badge bg-danger text-white"
                                                            style={{
                                                              fontSize:
                                                                '0.7rem',
                                                            }}
                                                          >
                                                            {allergy}
                                                          </span>
                                                        )
                                                      )}
                                                    </div>
                                                  </td>
                                                </tr>
                                              )
                                            )}
                                          </tbody>
                                        </table>
                                      </div>
                                    ) : (
                                      <div className="text-center text-muted py-3">
                                        <i className="fas fa-utensils me-2"></i>
                                        Žádní pracanti s alergiemi, ale job nemá
                                        jídlo na místě
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {showJobMap && selectedJobsForMap.length > 0 && (
                    <div className="row mb-4">
                      <div className="col-12">
                        <div className="card">
                          <div className="card-header">
                            <h5 className="mb-0">
                              <i className="fas fa-map me-2"></i>
                              Mapa vybraných jobů ({selectedJobsForMap.length})
                            </h5>
                          </div>
                          <div className="card-body">
                            <JobsMapView jobs={selectedJobsForMap} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="row">
                    <div className="col">
                      <div className="card">
                        <div className="card-header">
                          <h5 className="card-title mb-0">
                            <i className="fas fa-utensils me-2"></i>
                            Pracanti s potravinovými alergiemi
                          </h5>
                        </div>
                        <div className="card-body">
                          <div className="table-responsive">
                            <table className="table table-hover">
                              <thead>
                                <tr>
                                  <th>Pracant</th>
                                  <th>Telefon</th>
                                  <th>Oblast</th>
                                  <th>Job</th>
                                  <th>Adresa</th>
                                  <th>Alergie</th>
                                </tr>
                              </thead>
                              <tbody>
                                {allWorkersWithAllergies.map(
                                  (worker, index) => (
                                    <tr key={`${worker.id}-${index}`}>
                                      <td>
                                        <strong>
                                          {worker.firstName} {worker.lastName}
                                        </strong>
                                      </td>
                                      <td>
                                        <a
                                          href={`tel:${worker.phone}`}
                                          className="text-decoration-none"
                                        >
                                          <i className="fas fa-phone me-1"></i>
                                          {worker.phone}
                                        </a>
                                      </td>
                                      <td>
                                        <span className="badge bg-primary">
                                          {worker.areaName}
                                        </span>
                                      </td>
                                      <td>
                                        <strong>{worker.jobName}</strong>
                                      </td>
                                      <td>
                                        <small className="text-muted">
                                          {worker.jobAddress}
                                        </small>
                                      </td>
                                      <td>
                                        <div className="d-flex flex-wrap gap-1">
                                          {worker.allergies.map(
                                            (allergy, allergyIndex) => (
                                              <span
                                                key={allergyIndex}
                                                className="badge bg-danger"
                                              >
                                                {allergy}
                                              </span>
                                            )
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  )
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>
        </>
      )}
    </>
  )
}
