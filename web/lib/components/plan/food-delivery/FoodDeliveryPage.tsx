/* eslint-disable react-hooks/preserve-manual-memoization --
 * This component derives several Maps/Sets via useMemo from server data.
 * React Compiler treats Maps as mutable and refuses to preserve memoization,
 * but the derived values are never mutated after construction in this file.
 * The manual useMemo'ing is intentional and correct.
 */
'use client'
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import ErrorPage from 'lib/components/error-page/ErrorPage'
import PageHeader from 'lib/components/page-header/PageHeader'
import { useAPIPlan } from 'lib/fetcher/plan'
import { formatDateLong } from 'lib/helpers/helpers'
import { ActiveJobNoPlan } from 'lib/types/active-job'
import { deserializePlan } from 'lib/types/plan'
import { Serialized } from 'lib/types/serialize'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useMemo, useRef, useState } from 'react'
import ErrorPage404 from '../../404/404'
import { Assignment, useFoodDeliveryState } from './useFoodDeliveryState'
import RecipientPicker from './RecipientPicker'

const JobsMapView = dynamic(() => import('../JobsMapView'), { ssr: false })

type DragData =
  | { type: 'unassigned-job'; jobId: string }
  | { type: 'assigned-job'; jobId: string; fromCourierNum: number }

type DropData = { type: 'courier'; courierNum: number } | { type: 'unassign' }

function Droppable({
  id,
  data,
  className,
  highlightClassName,
  children,
}: {
  id: string
  data: DropData
  className?: string
  highlightClassName?: string
  children: React.ReactNode
}) {
  const { isOver, setNodeRef } = useDroppable({ id, data })
  const cls =
    `${className ?? ''} ${isOver ? (highlightClassName ?? '') : ''}`.trim()
  return (
    <div ref={setNodeRef} className={cls}>
      {children}
    </div>
  )
}

function DragHandle({
  attributes,
  listeners,
  label,
}: {
  attributes: ReturnType<typeof useDraggable>['attributes']
  listeners: ReturnType<typeof useDraggable>['listeners']
  label: string
}) {
  return (
    <div
      {...attributes}
      {...listeners}
      aria-label={label}
      title="Přetáhnout pro přiřazení k rozvozníkovi"
      className="d-flex align-items-center justify-content-center text-muted"
      style={{
        cursor: 'grab',
        width: 22,
        alignSelf: 'stretch',
        borderRadius: 4,
        userSelect: 'none',
        backgroundColor: 'rgba(0,0,0,0.03)',
        flexShrink: 0,
      }}
      onMouseEnter={e =>
        (e.currentTarget.style.backgroundColor = 'rgba(13,110,253,0.12)')
      }
      onMouseLeave={e =>
        (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.03)')
      }
    >
      <i className="fas fa-grip-vertical" style={{ fontSize: 12 }}></i>
    </div>
  )
}

interface Props {
  planId: string
  initialDataPlan?: Serialized
}

// Defaults předvyplněné při prvním přiřazení jobu rozvozníkovi:
// – alergici vždy (dostanou speciální jídlo), plus
// – všichni ostatní, když se na místě nevaří (jinak jim rozvoz nedáváme).
function defaultRecipientsFor(job: ActiveJobNoPlan): string[] {
  if (!job.proposedJob.hasFood) return job.workers.map(w => w.id)
  return job.workers.filter(w => w.foodAllergies.length > 0).map(w => w.id)
}

function isSuggested(job: ActiveJobNoPlan): boolean {
  return (
    !job.proposedJob.hasFood ||
    job.workers.some(w => w.foodAllergies.length > 0)
  )
}

export default function FoodDeliveryPage({ planId, initialDataPlan }: Props) {
  const fallback = initialDataPlan
    ? deserializePlan(initialDataPlan)
    : undefined
  const { data: planData, error: planError } = useAPIPlan(planId, {
    fallbackData: fallback,
  })

  const state = useFoodDeliveryState(planId)
  const {
    deliveries,
    assignments,
    courierNums,
    courierNotes,
    loadError,
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
  } = state

  const [showOtherJobs, setShowOtherJobs] = useState(false)
  const [otherSearch, setOtherSearch] = useState('')
  const [suggestedSearch, setSuggestedSearch] = useState('')
  const [showMap, setShowMap] = useState(false)
  const [showAllJobsOnMap, setShowAllJobsOnMap] = useState(false)
  const [highlightJobId, setHighlightJobId] = useState<string | null>(null)
  const [expandedRecipients, setExpandedRecipients] = useState<Set<string>>(
    new Set()
  )
  const [draggedJobId, setDraggedJobId] = useState<string | null>(null)
  const mapCardRef = useRef<HTMLDivElement | null>(null)

  // Require ~5px movement before drag starts so simple clicks on row buttons
  // (chevron, X, map pin) don't get hijacked.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as DragData | undefined
    if (!data) return
    setDraggedJobId(data.jobId)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggedJobId(null)
    const dragData = event.active.data.current as DragData | undefined
    const dropData = event.over?.data.current as DropData | undefined
    if (!dragData || !dropData) return

    if (dropData.type === 'courier') {
      const job = jobsById.get(dragData.jobId)
      if (!job) return
      // No-op when dropping onto the same courier
      if (
        dragData.type === 'assigned-job' &&
        dragData.fromCourierNum === dropData.courierNum
      )
        return
      const existing = assignments.get(dragData.jobId)
      // Preserve recipients on reassignment; on new assignment prefill defaults
      // (all allergics, plus everyone when there's no food on-site).
      const recipientIds = existing
        ? Array.from(existing.recipientIds)
        : defaultRecipientsFor(job)
      assignJob(dragData.jobId, dropData.courierNum, recipientIds)
    } else if (dropData.type === 'unassign') {
      if (dragData.type === 'assigned-job') {
        unassignJob(dragData.jobId)
      }
    }
  }

  const showJobOnMap = (jobId: string) => {
    setShowMap(true)
    // Force re-trigger when same id is clicked twice in a row
    setHighlightJobId(null)
    setTimeout(() => {
      setHighlightJobId(jobId)
      mapCardRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 0)
  }

  const jobsById = useMemo(
    () =>
      new Map<string, ActiveJobNoPlan>(
        (planData?.jobs ?? []).map(j => [j.id, j] as const)
      ),
    [planData]
  )

  const suggestedJobs = useMemo(
    () => (planData?.jobs ?? []).filter(isSuggested),
    [planData]
  )

  const otherJobs = useMemo(
    () =>
      (planData?.jobs ?? []).filter(
        j =>
          !isSuggested(j) &&
          j.proposedJob.name.toLowerCase().includes(otherSearch.toLowerCase())
      ),
    [planData, otherSearch]
  )

  const unassignedSuggested = useMemo(
    () => suggestedJobs.filter(j => !assignments.has(j.id)),
    [suggestedJobs, assignments]
  )

  const unassignedSuggestedFiltered = useMemo(() => {
    const q = suggestedSearch.trim().toLowerCase()
    if (!q) return unassignedSuggested
    return unassignedSuggested.filter(j =>
      j.proposedJob.name.toLowerCase().includes(q)
    )
  }, [unassignedSuggested, suggestedSearch])

  const couriersView = useMemo(() => {
    return courierNums.map(num => {
      const jobs: Array<{ job: ActiveJobNoPlan; assignment: Assignment }> = []
      for (const [jobId, a] of assignments) {
        if (a.courierNum !== num) continue
        const job = jobsById.get(jobId)
        if (job) jobs.push({ job, assignment: a })
      }
      return { courierNum: num, jobs }
    })
  }, [assignments, courierNums, jobsById])

  const mapJobs = useMemo(() => {
    const result: ActiveJobNoPlan[] = []
    const seen = new Set<string>()
    for (const jobId of assignments.keys()) {
      const job = jobsById.get(jobId)
      if (job) {
        result.push(job)
        seen.add(jobId)
      }
    }
    for (const job of suggestedJobs) {
      if (!seen.has(job.id)) {
        result.push(job)
        seen.add(job.id)
      }
    }
    if (showAllJobsOnMap) {
      for (const job of planData?.jobs ?? []) {
        if (!seen.has(job.id)) result.push(job)
      }
    }
    return result
  }, [assignments, jobsById, suggestedJobs, showAllJobsOnMap, planData])

  const courierNumByJobId = useMemo(() => {
    const map: { [jobId: string]: number } = {}
    for (const [jobId, a] of assignments) map[jobId] = a.courierNum
    return map
  }, [assignments])

  const handleMapAssign = (jobId: string, courierNum: number | null) => {
    if (courierNum === null) {
      unassignJob(jobId)
      return
    }
    const job = jobsById.get(jobId)
    if (!job) return
    const existing = assignments.get(jobId)
    const recipientIds = existing
      ? Array.from(existing.recipientIds)
      : defaultRecipientsFor(job)
    assignJob(jobId, courierNum, recipientIds)
  }

  const completedActiveJobIds = useMemo(() => {
    const set = new Set<string>()
    for (const d of deliveries ?? []) {
      for (const j of d.jobs) {
        if (j.completed) set.add(j.activeJobId)
      }
    }
    return set
  }, [deliveries])

  const stats = useMemo(() => {
    const perCourier = new Map<
      number,
      {
        jobs: number
        deliveredJobs: number
        allergenMeals: number
        standardMeals: number
        deliveredAllergenMeals: number
        deliveredStandardMeals: number
      }
    >()
    for (const num of courierNums) {
      perCourier.set(num, {
        jobs: 0,
        deliveredJobs: 0,
        allergenMeals: 0,
        standardMeals: 0,
        deliveredAllergenMeals: 0,
        deliveredStandardMeals: 0,
      })
    }
    for (const [jobId, a] of assignments) {
      const job = jobsById.get(jobId)
      if (!job) continue
      const bucket = perCourier.get(a.courierNum) ?? {
        jobs: 0,
        deliveredJobs: 0,
        allergenMeals: 0,
        standardMeals: 0,
        deliveredAllergenMeals: 0,
        deliveredStandardMeals: 0,
      }
      bucket.jobs += 1
      const isDelivered = completedActiveJobIds.has(jobId)
      if (isDelivered) bucket.deliveredJobs += 1
      for (const worker of job.workers) {
        if (!a.recipientIds.has(worker.id)) continue
        if (worker.foodAllergies.length > 0) {
          bucket.allergenMeals += 1
          if (isDelivered) bucket.deliveredAllergenMeals += 1
        } else {
          bucket.standardMeals += 1
          if (isDelivered) bucket.deliveredStandardMeals += 1
        }
      }
      perCourier.set(a.courierNum, bucket)
    }

    let unassignedJobs = 0
    let unassignedAllergenMeals = 0
    let unassignedStandardMeals = 0
    for (const job of unassignedSuggested) {
      unassignedJobs += 1
      const recipientIds = new Set(defaultRecipientsFor(job))
      for (const worker of job.workers) {
        if (!recipientIds.has(worker.id)) continue
        if (worker.foodAllergies.length > 0) unassignedAllergenMeals += 1
        else unassignedStandardMeals += 1
      }
    }

    return {
      perCourier,
      unassignedJobs,
      unassignedAllergenMeals,
      unassignedStandardMeals,
    }
  }, [
    assignments,
    courierNums,
    jobsById,
    unassignedSuggested,
    completedActiveJobIds,
  ])

  const totalMeals = useMemo(() => {
    let allergen = 0
    let standard = 0
    let deliveredAllergen = 0
    let deliveredStandard = 0
    let deliveredJobs = 0
    let totalJobs = 0
    for (const bucket of stats.perCourier.values()) {
      allergen += bucket.allergenMeals
      standard += bucket.standardMeals
      deliveredAllergen += bucket.deliveredAllergenMeals
      deliveredStandard += bucket.deliveredStandardMeals
      deliveredJobs += bucket.deliveredJobs
      totalJobs += bucket.jobs
    }
    const total = allergen + standard
    const delivered = deliveredAllergen + deliveredStandard
    return {
      allergen,
      standard,
      total,
      delivered,
      deliveredAllergen,
      deliveredStandard,
      deliveredJobs,
      totalJobs,
      mealPercent: total > 0 ? Math.round((delivered / total) * 100) : 0,
      jobPercent:
        totalJobs > 0 ? Math.round((deliveredJobs / totalJobs) * 100) : 0,
    }
  }, [stats])

  const toggleRecipientsExpanded = (jobId: string) => {
    setExpandedRecipients(prev => {
      const next = new Set(prev)
      if (next.has(jobId)) next.delete(jobId)
      else next.add(jobId)
      return next
    })
  }

  if (planError && !planData) return <ErrorPage error={planError} />
  if (planData === null) return <ErrorPage404 message="Plán nenalezen." />
  if (!planData) {
    return (
      <div className="text-center p-5">
        <i className="fas fa-spinner fa-spin fa-2x"></i>
      </div>
    )
  }

  const totalAssigned = assignments.size
  const draggedJob = draggedJobId ? jobsById.get(draggedJobId) : undefined

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDraggedJobId(null)}
    >
      <PageHeader title={`Rozvoz jídla – ${formatDateLong(planData.day)}`}>
        <Link href={`/plans/${planId}`}>
          <button className="btn btn-secondary btn-with-icon" type="button">
            <i className="fas fa-arrow-left"></i>
            <span>Zpět na plán</span>
          </button>
        </Link>
        <button
          className="btn btn-success btn-with-icon"
          type="button"
          onClick={addCourier}
        >
          <i className="fas fa-plus"></i>
          <span>Přidat rozvozníka</span>
        </button>
        <button
          className="btn btn-outline-primary btn-with-icon"
          type="button"
          onClick={() => setShowMap(v => !v)}
          disabled={mapJobs.length === 0}
        >
          <i className="fas fa-map"></i>
          <span>{showMap ? 'Skrýt mapu' : 'Zobrazit mapu'}</span>
        </button>
        <Link href={`/print-food-delivery/${planId}`} target="_blank">
          <button
            className="btn btn-primary btn-with-icon"
            type="button"
            title="Otevřít tiskovou verzi v nové záložce"
          >
            <i className="fas fa-print"></i>
            <span>Tisk všech rozvozníků</span>
          </button>
        </Link>
        <button
          className="btn btn-outline-danger btn-with-icon"
          type="button"
          onClick={clearAll}
          disabled={totalAssigned === 0}
        >
          <i className="fas fa-trash-alt"></i>
          <span>Vymazat přiřazení</span>
        </button>
      </PageHeader>

      <section>
        <div className="container-fluid">
          {loadError && (
            <div className="alert alert-danger">
              <i className="fas fa-exclamation-triangle me-2"></i>
              Chyba při načítání: {loadError.message}
            </div>
          )}
          <div role="status" aria-live="polite" aria-atomic="true">
            {saveState === 'saving' && (
              <div className="alert alert-info py-2">
                <i className="fas fa-spinner fa-spin me-2"></i>Ukládám změny…
              </div>
            )}
            {saveState === 'saved' && (
              <div className="alert alert-success py-2">
                <i className="fas fa-check me-2"></i>Změny uloženy
              </div>
            )}
            {saveState === 'error' && (
              <div className="alert alert-danger py-2" role="alert">
                <i className="fas fa-exclamation-triangle me-2"></i>
                {saveError ?? 'Chyba při ukládání'}
              </div>
            )}
          </div>

          {(courierNums.length > 0 || stats.unassignedJobs > 0) && (
            <div className="card mb-3 border-info">
              <div className="card-header bg-info text-white py-2">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                  <strong>
                    <i className="fas fa-chart-pie me-2"></i>
                    Statistiky rozvozu
                  </strong>
                  <span className="small">
                    Celkem {totalMeals.total} jídel ({totalMeals.allergen} pro
                    alergiky, {totalMeals.standard} běžných)
                  </span>
                </div>
                {totalMeals.total > 0 && (
                  <div>
                    <div className="d-flex justify-content-between small mb-1">
                      <span>
                        <i className="fas fa-truck me-1"></i>
                        Doručeno: {totalMeals.delivered} z {totalMeals.total}{' '}
                        jídel ({totalMeals.deliveredJobs}/{totalMeals.totalJobs}{' '}
                        jobů)
                      </span>
                      <strong>{totalMeals.mealPercent}%</strong>
                    </div>
                    <div
                      className="progress"
                      role="progressbar"
                      aria-label="Celkový postup rozvozu jídel"
                      aria-valuenow={totalMeals.mealPercent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      style={{ height: 10 }}
                    >
                      <div
                        className="progress-bar bg-success"
                        style={{ width: `${totalMeals.mealPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="card-body p-2">
                <div className="row g-2 text-center">
                  {courierNums.map(num => {
                    const s = stats.perCourier.get(num) ?? {
                      jobs: 0,
                      deliveredJobs: 0,
                      allergenMeals: 0,
                      standardMeals: 0,
                      deliveredAllergenMeals: 0,
                      deliveredStandardMeals: 0,
                    }
                    const totalMealsForCourier =
                      s.allergenMeals + s.standardMeals
                    const deliveredMealsForCourier =
                      s.deliveredAllergenMeals + s.deliveredStandardMeals
                    const courierPercent =
                      totalMealsForCourier > 0
                        ? Math.round(
                            (deliveredMealsForCourier / totalMealsForCourier) *
                              100
                          )
                        : 0
                    return (
                      <div key={num} className="col-6 col-md-4 col-lg">
                        <div className="border rounded p-2 h-100">
                          <div className="h4 mb-1 text-primary">{s.jobs}</div>
                          <div className="small text-muted mb-1">
                            Rozvozník {num}
                          </div>
                          <div className="small text-danger">
                            <i className="fas fa-apple-alt me-1"></i>
                            Alergici: {s.allergenMeals}
                          </div>
                          <div className="small text-success">
                            <i className="fas fa-utensils me-1"></i>
                            Běžná: {s.standardMeals}
                          </div>
                          {totalMealsForCourier > 0 && (
                            <div
                              className="progress mt-2"
                              role="progressbar"
                              aria-label={`Postup rozvozníka ${num}`}
                              aria-valuenow={courierPercent}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              style={{ height: 6 }}
                              title={`${deliveredMealsForCourier}/${totalMealsForCourier} jídel`}
                            >
                              <div
                                className="progress-bar bg-success"
                                style={{ width: `${courierPercent}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {stats.unassignedJobs > 0 && (
                    <div className="col-6 col-md-4 col-lg">
                      <div className="border rounded p-2 h-100 border-warning">
                        <div className="h4 mb-1 text-warning">
                          {stats.unassignedJobs}
                        </div>
                        <div className="small text-muted mb-1">Nepřiřazeno</div>
                        <div className="small text-danger">
                          <i className="fas fa-apple-alt me-1"></i>
                          Alergici: {stats.unassignedAllergenMeals}
                        </div>
                        <div className="small text-success">
                          <i className="fas fa-utensils me-1"></i>
                          Běžná: {stats.unassignedStandardMeals}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="row g-3">
            <div className="col-lg-4">
              <Droppable
                id="dropzone-unassign"
                data={{ type: 'unassign' }}
                className="card"
                highlightClassName="border-primary border-2 bg-light"
              >
                <div className="card-header">
                  <strong>Navržené joby</strong>{' '}
                  <span className="text-muted small">
                    ({unassignedSuggested.length} nepřiřazených /{' '}
                    {suggestedJobs.length} celkem)
                  </span>
                </div>
                <div className="card-body p-2">
                  {unassignedSuggested.length === 0 ? (
                    suggestedJobs.length === 0 ? (
                      <div className="text-muted small text-center p-3">
                        <i className="fas fa-check-circle text-success me-2"></i>
                        V tomto plánu nejsou žádné joby, které by potřebovaly
                        rozvoz jídla.
                      </div>
                    ) : (
                      <div className="text-muted small text-center p-3">
                        <i className="fas fa-check-circle text-success me-2"></i>
                        Všechny navržené joby jsou přiřazené.
                      </div>
                    )
                  ) : (
                    <>
                      <input
                        type="text"
                        className="form-control form-control-sm mb-2"
                        placeholder="Hledat navržený job..."
                        value={suggestedSearch}
                        onChange={e => setSuggestedSearch(e.target.value)}
                        aria-label="Hledat mezi navrženými joby"
                      />
                      {unassignedSuggestedFiltered.length === 0 ? (
                        <div className="text-muted small text-center p-3">
                          <i className="fas fa-search me-2"></i>
                          Žádný navržený job neodpovídá hledání.
                        </div>
                      ) : (
                        <div className="list-group list-group-flush">
                          {unassignedSuggestedFiltered.map(job => (
                            <JobCandidateRow
                              key={job.id}
                              job={job}
                              courierNums={courierNums}
                              onAssign={num =>
                                assignJob(
                                  job.id,
                                  num,
                                  defaultRecipientsFor(job)
                                )
                              }
                              onShowOnMap={() => showJobOnMap(job.id)}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="card-footer p-2">
                  <button
                    className="btn btn-sm btn-link text-decoration-none text-muted w-100"
                    onClick={() => setShowOtherJobs(v => !v)}
                  >
                    {showOtherJobs ? 'Skrýt' : 'Zobrazit'} ostatní joby v plánu
                  </button>
                  {showOtherJobs && (
                    <div className="mt-2">
                      <input
                        type="text"
                        className="form-control form-control-sm mb-2"
                        placeholder="Hledat..."
                        value={otherSearch}
                        onChange={e => setOtherSearch(e.target.value)}
                      />
                      <div className="list-group list-group-flush">
                        {otherJobs
                          .filter(j => !assignments.has(j.id))
                          .map(job => (
                            <JobCandidateRow
                              key={job.id}
                              job={job}
                              courierNums={courierNums}
                              manual
                              onAssign={num =>
                                assignJob(
                                  job.id,
                                  num,
                                  defaultRecipientsFor(job)
                                )
                              }
                              onShowOnMap={() => showJobOnMap(job.id)}
                            />
                          ))}
                        {otherJobs.filter(j => !assignments.has(j.id))
                          .length === 0 && (
                          <div className="text-muted small p-2">
                            Žádné další joby.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Droppable>
            </div>

            <div className="col-lg-8">
              {showMap && mapJobs.length > 0 && (
                <section
                  className="card mb-3"
                  ref={mapCardRef}
                  aria-label="Mapa rozvozů"
                >
                  <div className="card-header">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                      <strong>
                        <i className="fas fa-map me-2"></i>
                        Mapa rozvozů
                      </strong>
                      <span className="text-muted small">
                        Číslo = rozvozník · šedý „?“ = nepřiřazeno
                      </span>
                    </div>
                    <div className="form-check mt-2 mb-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="show-all-jobs-on-map"
                        checked={showAllJobsOnMap}
                        onChange={e => setShowAllJobsOnMap(e.target.checked)}
                      />
                      <label
                        className="form-check-label small"
                        htmlFor="show-all-jobs-on-map"
                      >
                        Zobrazit i joby, které nepotřebují rozvoz
                      </label>
                    </div>
                  </div>
                  <div className="card-body p-3">
                    <JobsMapView
                      jobs={mapJobs}
                      jobOrder={courierNumByJobId}
                      courierNums={courierNums}
                      onAssignCourier={handleMapAssign}
                      highlightJobId={highlightJobId}
                      height={420}
                    />
                  </div>
                </section>
              )}

              {couriersView.length === 0 ? (
                <div className="card text-center border-primary">
                  <div className="card-body p-4">
                    <i className="fas fa-truck fa-3x text-primary mb-3"></i>
                    <h5>Začni přidáním rozvozníka</h5>
                    <p className="text-muted mb-3">
                      Vytvoř prvního rozvozníka, pak přiřaď navržené joby z
                      levého panelu.
                    </p>
                    <button
                      type="button"
                      className="btn btn-success btn-with-icon"
                      onClick={addCourier}
                    >
                      <i className="fas fa-plus"></i>
                      <span>Přidat rozvozníka</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="row g-3">
                  {couriersView.map(({ courierNum, jobs }) => (
                    <div key={courierNum} className="col-md-6">
                      <Droppable
                        id={`dropzone-courier-${courierNum}`}
                        data={{ type: 'courier', courierNum }}
                        className="card h-100"
                        highlightClassName="border-success border-2"
                      >
                        <div className="card-header bg-primary text-white">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <i className="fas fa-truck me-2"></i>
                              <strong>Rozvozník {courierNum}</strong>
                              <span className="ms-2 small">
                                {jobs.length} job
                                {jobs.length === 1 ? '' : 'ů'}
                              </span>
                            </div>
                            <div className="btn-group">
                              {deliveryIdByCourier.get(courierNum) && (
                                <Link
                                  href={`/plan/${planId}/courier/${deliveryIdByCourier.get(
                                    courierNum
                                  )}`}
                                  title="Pohled rozvozníka"
                                >
                                  <button className="btn btn-sm btn-outline-light">
                                    <i className="fas fa-eye"></i>
                                  </button>
                                </Link>
                              )}
                              <Link
                                href={`/print-food-delivery/${planId}?courier=${courierNum}`}
                                target="_blank"
                                title="Vytisknout pouze tohoto rozvozníka"
                              >
                                <button className="btn btn-sm btn-outline-light">
                                  <i className="fas fa-print"></i>
                                </button>
                              </Link>
                              <button
                                className="btn btn-sm btn-outline-light"
                                onClick={() => {
                                  if (
                                    confirm(
                                      `Odstranit rozvozníka ${courierNum} a jeho přiřazení?`
                                    )
                                  )
                                    removeCourier(courierNum)
                                }}
                                title="Odstranit rozvozníka"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </div>
                          {(() => {
                            const s = stats.perCourier.get(courierNum)
                            if (!s) return null
                            const total = s.allergenMeals + s.standardMeals
                            const delivered =
                              s.deliveredAllergenMeals +
                              s.deliveredStandardMeals
                            const percent =
                              total > 0
                                ? Math.round((delivered / total) * 100)
                                : 0
                            if (total === 0) return null
                            return (
                              <div className="mt-2">
                                <div className="d-flex justify-content-between small mb-1">
                                  <span>
                                    Doručeno: {delivered}/{total} jídel
                                  </span>
                                  <strong>{percent}%</strong>
                                </div>
                                <div
                                  className="progress"
                                  role="progressbar"
                                  aria-label={`Postup rozvozníka ${courierNum}`}
                                  aria-valuenow={percent}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                  style={{ height: 6 }}
                                >
                                  <div
                                    className="progress-bar bg-success"
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                              </div>
                            )
                          })()}
                        </div>
                        <div className="card-body p-2">
                          <div className="mb-2">
                            <textarea
                              className="form-control form-control-sm"
                              placeholder="Poznámka pro rozvozníka (např. „klíče od kuchyně u Pepy“)"
                              rows={2}
                              value={courierNotes.get(courierNum) ?? ''}
                              onChange={e =>
                                setCourierNote(courierNum, e.target.value)
                              }
                              aria-label={`Poznámka pro rozvozníka ${courierNum}`}
                            />
                          </div>
                          {jobs.length === 0 ? (
                            <div className="text-muted small text-center py-2">
                              Žádné joby
                            </div>
                          ) : (
                            <div className="list-group list-group-flush">
                              {jobs.map(({ job, assignment }) => (
                                <CourierJobRow
                                  key={job.id}
                                  job={job}
                                  assignment={assignment}
                                  expanded={expandedRecipients.has(job.id)}
                                  onToggleExpanded={() =>
                                    toggleRecipientsExpanded(job.id)
                                  }
                                  onUnassign={() => unassignJob(job.id)}
                                  onShowOnMap={() => showJobOnMap(job.id)}
                                  onToggleRecipient={workerId => {
                                    const next = new Set(
                                      assignment.recipientIds
                                    )
                                    if (next.has(workerId))
                                      next.delete(workerId)
                                    else next.add(workerId)
                                    setRecipients(job.id, next)
                                  }}
                                  onSetRecipients={ids =>
                                    setRecipients(job.id, ids)
                                  }
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </Droppable>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      <DragOverlay dropAnimation={null}>
        {draggedJob ? (
          <div
            className="card shadow"
            style={{ maxWidth: 320, opacity: 0.9, pointerEvents: 'none' }}
          >
            <div className="card-body p-2">
              <div className="fw-semibold small text-break">
                <i className="fas fa-grip-vertical me-2 text-muted"></i>
                {draggedJob.proposedJob.name}
              </div>
              <div className="text-muted small text-break">
                {draggedJob.proposedJob.area?.name ?? 'Bez oblasti'}
              </div>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

function JobCandidateRow({
  job,
  courierNums,
  manual,
  onAssign,
  onShowOnMap,
}: {
  job: ActiveJobNoPlan
  courierNums: number[]
  manual?: boolean
  onAssign: (courierNum: number) => void
  onShowOnMap: () => void
}) {
  const allergens = Array.from(
    new Set(job.workers.flatMap(w => w.foodAllergies.map(a => a.name)))
  )
  const hasCoords =
    !!job.proposedJob.coordinates &&
    job.proposedJob.coordinates.length >= 2 &&
    job.proposedJob.coordinates[0] !== null &&
    job.proposedJob.coordinates[1] !== null
  const dragData: DragData = { type: 'unassigned-job', jobId: job.id }
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `unassigned:${job.id}`,
    data: dragData,
  })
  return (
    <div
      ref={setNodeRef}
      className="list-group-item p-0"
      style={{ opacity: isDragging ? 0.4 : 1 }}
    >
      <div className="d-flex align-items-stretch gap-2 p-2">
        <DragHandle
          attributes={attributes}
          listeners={listeners}
          label="Přetáhnout job na rozvozníka"
        />
        <div className="flex-grow-1" style={{ minWidth: 0 }}>
          <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
            <div className="flex-grow-1" style={{ minWidth: 0 }}>
              <div className="fw-semibold text-break">
                {job.proposedJob.name}
              </div>
              <div className="d-flex flex-wrap gap-1 mt-1">
                {manual && <span className="badge bg-secondary">Ručně</span>}
                {!job.proposedJob.hasFood && (
                  <span className="badge bg-warning text-dark">
                    <i className="fas fa-utensils me-1"></i>Bez jídla
                  </span>
                )}
                {allergens.length > 0 && (
                  <span
                    className="badge bg-danger"
                    title={allergens.join(', ')}
                  >
                    <i className="fas fa-apple-alt me-1"></i>
                    {allergens.length}× alergie
                  </span>
                )}
              </div>
            </div>
            {hasCoords && (
              <button
                type="button"
                className="btn btn-sm btn-outline-primary flex-shrink-0"
                onClick={onShowOnMap}
                title="Zobrazit na mapě"
                aria-label="Zobrazit na mapě"
              >
                <i className="fas fa-map-marker-alt"></i>
              </button>
            )}
          </div>
          <div className="text-muted small text-break mb-2">
            <i className="fas fa-location-dot me-1"></i>
            {job.proposedJob.area?.name ?? 'Bez oblasti'} ·{' '}
            {job.proposedJob.address}
          </div>
          {courierNums.length === 0 ? (
            <span className="text-muted small fst-italic">
              <i className="fas fa-info-circle me-1"></i>
              Nejprve přidej rozvozníka
            </span>
          ) : (
            <select
              className="form-select form-select-sm"
              defaultValue=""
              aria-label={`Přiřadit ${job.proposedJob.name} rozvozníkovi`}
              onChange={e => {
                const v = parseInt(e.target.value)
                if (!isNaN(v)) onAssign(v)
                e.target.value = ''
              }}
            >
              <option value="" disabled>
                Přiřadit rozvozníkovi…
              </option>
              {courierNums.map(n => (
                <option key={n} value={n}>
                  Rozvozník {n}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
    </div>
  )
}

function CourierJobRow({
  job,
  assignment,
  expanded,
  onToggleExpanded,
  onUnassign,
  onShowOnMap,
  onToggleRecipient,
  onSetRecipients,
}: {
  job: ActiveJobNoPlan
  assignment: Assignment
  expanded: boolean
  onToggleExpanded: () => void
  onUnassign: () => void
  onShowOnMap: () => void
  onToggleRecipient: (workerId: string) => void
  onSetRecipients: (ids: Set<string>) => void
}) {
  const dragData: DragData = {
    type: 'assigned-job',
    jobId: job.id,
    fromCourierNum: assignment.courierNum,
  }
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `assigned:${job.id}`,
    data: dragData,
  })
  const recipients = job.workers.filter(w => assignment.recipientIds.has(w.id))
  const hasCoords =
    !!job.proposedJob.coordinates &&
    job.proposedJob.coordinates.length >= 2 &&
    job.proposedJob.coordinates[0] !== null &&
    job.proposedJob.coordinates[1] !== null
  // Warn when no recipients are picked but the job would normally have some
  // (= someone with allergies, or no food on-site at all).
  const shouldHaveRecipients = defaultRecipientsFor(job).length > 0
  const missingRecipients =
    shouldHaveRecipients && assignment.recipientIds.size === 0
  return (
    <div
      ref={setNodeRef}
      className="list-group-item p-0"
      style={{ opacity: isDragging ? 0.4 : 1 }}
    >
      <div className="d-flex align-items-stretch gap-2 p-2">
        <DragHandle
          attributes={attributes}
          listeners={listeners}
          label="Přesunout job mezi rozvozníky"
        />
        <div className="flex-grow-1" style={{ minWidth: 0 }}>
          <div className="d-flex justify-content-between align-items-start gap-2">
            <div className="flex-grow-1" style={{ minWidth: 0 }}>
              <div className="fw-semibold small text-break">
                {job.proposedJob.name}
              </div>
              <div className="text-muted small text-break">
                <i className="fas fa-location-dot me-1"></i>
                {job.proposedJob.address}
              </div>
            </div>
            <div className="d-flex gap-1 flex-shrink-0">
              {hasCoords && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={onShowOnMap}
                  title="Zobrazit na mapě"
                  aria-label="Zobrazit na mapě"
                >
                  <i className="fas fa-map-marker-alt"></i>
                </button>
              )}
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={onToggleExpanded}
                title={expanded ? 'Skrýt příjemce' : 'Upravit příjemce'}
                aria-label={expanded ? 'Skrýt příjemce' : 'Upravit příjemce'}
              >
                <i className={`fas fa-chevron-${expanded ? 'up' : 'down'}`}></i>
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={onUnassign}
                title="Odebrat z rozvozu"
                aria-label="Odebrat z rozvozu"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
          <div className="d-flex flex-wrap align-items-center gap-2 mt-2 small">
            <span
              className={`badge ${
                missingRecipients
                  ? 'bg-warning text-dark'
                  : recipients.length === 0
                    ? 'bg-secondary'
                    : 'bg-success'
              }`}
            >
              <i className="fas fa-users me-1"></i>
              {recipients.length}/{job.workers.length} příjemců
            </span>
            {missingRecipients && (
              <span
                className="text-warning fw-semibold"
                title="Tento job by měl mít alespoň jednoho příjemce — nikdo nedostane jídlo."
              >
                <i className="fas fa-exclamation-triangle me-1"></i>
                Vyber příjemce
              </span>
            )}
            {recipients.length > 0 && !expanded && (
              <span className="text-muted text-truncate">
                {recipients.map(r => `${r.firstName} ${r.lastName}`).join(', ')}
              </span>
            )}
          </div>
        </div>
      </div>
      {expanded && (
        <div className="px-3 pb-3 pt-1">
          <div className="ps-2 border-start">
            <RecipientPicker
              workers={job.workers}
              selectedIds={assignment.recipientIds}
              onToggle={onToggleRecipient}
              onSetSelection={onSetRecipients}
            />
          </div>
        </div>
      )}
    </div>
  )
}
