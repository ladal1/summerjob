'use client'
import ErrorPage from 'lib/components/error-page/ErrorPage'
import PageHeader from 'lib/components/page-header/PageHeader'
import { useAPIPlan } from 'lib/fetcher/plan'
import { formatDateLong } from 'lib/helpers/helpers'
import { ActiveJobNoPlan } from 'lib/types/active-job'
import { deserializePlan } from 'lib/types/plan'
import { Serialized } from 'lib/types/serialize'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import ErrorPage404 from '../../404/404'
import { Assignment, useFoodDeliveryState } from './useFoodDeliveryState'
import RecipientPicker from './RecipientPicker'

interface Props {
  planId: string
  initialDataPlan?: Serialized
}

function defaultRecipientsFor(job: ActiveJobNoPlan): string[] {
  const allergic = job.workers
    .filter(w => w.foodAllergies.length > 0)
    .map(w => w.id)
  if (allergic.length > 0) return allergic
  if (!job.proposedJob.hasFood) return job.workers.map(w => w.id)
  return []
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
    assignments,
    courierNums,
    loadError,
    saveState,
    saveError,
    assignJob,
    unassignJob,
    setRecipients,
    addCourier,
    removeCourier,
    clearAll,
    deliveryIdByCourier,
  } = state

  const [showOtherJobs, setShowOtherJobs] = useState(false)
  const [otherSearch, setOtherSearch] = useState('')
  const [expandedRecipients, setExpandedRecipients] = useState<Set<string>>(
    new Set()
  )

  const jobsById = useMemo(() => {
    const m = new Map<string, ActiveJobNoPlan>()
    for (const j of planData?.jobs ?? []) m.set(j.id, j)
    return m
  }, [planData])

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

  return (
    <>
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
            <div className="alert alert-danger py-2">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {saveError ?? 'Chyba při ukládání'}
            </div>
          )}

          <div className="row g-3">
            <div className="col-lg-4">
              <div className="card">
                <div className="card-header">
                  <strong>Navržené joby</strong>{' '}
                  <span className="text-muted small">
                    ({unassignedSuggested.length} nepřiřazených /{' '}
                    {suggestedJobs.length} celkem)
                  </span>
                </div>
                <div className="card-body p-2">
                  {unassignedSuggested.length === 0 ? (
                    <div className="text-muted small p-2">
                      Vše je přiřazeno nebo není co řešit.
                    </div>
                  ) : (
                    <div className="list-group list-group-flush">
                      {unassignedSuggested.map(job => (
                        <JobCandidateRow
                          key={job.id}
                          job={job}
                          courierNums={courierNums}
                          onAssign={num =>
                            assignJob(job.id, num, defaultRecipientsFor(job))
                          }
                        />
                      ))}
                    </div>
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
                                  job.workers.map(w => w.id)
                                )
                              }
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
              </div>
            </div>

            <div className="col-lg-8">
              {couriersView.length === 0 ? (
                <div className="alert alert-info">
                  <i className="fas fa-info-circle me-2"></i>
                  Přidej rozvozníka a přiřaď joby z levého panelu.
                </div>
              ) : (
                <div className="row g-3">
                  {couriersView.map(({ courierNum, jobs }) => (
                    <div key={courierNum} className="col-md-6">
                      <div className="card h-100">
                        <div className="card-header d-flex justify-content-between align-items-center bg-primary text-white">
                          <div>
                            <i className="fas fa-truck me-2"></i>
                            <strong>Rozvozník {courierNum}</strong>
                            <span className="ms-2 small">
                              {jobs.length} job{jobs.length === 1 ? '' : 'ů'}
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
                        <div className="card-body p-2">
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
                                  onToggleRecipient={workerId => {
                                    const next = new Set(
                                      assignment.recipientIds
                                    )
                                    if (next.has(workerId))
                                      next.delete(workerId)
                                    else next.add(workerId)
                                    setRecipients(job.id, next)
                                  }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

function JobCandidateRow({
  job,
  courierNums,
  manual,
  onAssign,
}: {
  job: ActiveJobNoPlan
  courierNums: number[]
  manual?: boolean
  onAssign: (courierNum: number) => void
}) {
  const allergens = Array.from(
    new Set(job.workers.flatMap(w => w.foodAllergies.map(a => a.name)))
  )
  return (
    <div className="list-group-item py-3 px-3">
      <div className="mb-2">
        <div className="fw-semibold text-break">
          {job.proposedJob.name}
          {manual && (
            <span className="badge bg-secondary ms-2 align-middle">Ručně</span>
          )}
          {!job.proposedJob.hasFood && (
            <span className="badge bg-warning text-dark ms-2 align-middle">
              Bez jídla
            </span>
          )}
        </div>
        <div className="text-muted small text-break">
          {job.proposedJob.area?.name ?? 'Bez oblasti'} ·{' '}
          {job.proposedJob.address}
        </div>
        {allergens.length > 0 && (
          <div className="small mt-1 text-break">
            <span className="badge bg-danger me-1">Alergie</span>
            {allergens.join(', ')}
          </div>
        )}
      </div>
      {courierNums.length === 0 ? (
        <span className="text-muted small fst-italic">
          Nejprve přidej rozvozníka
        </span>
      ) : (
        <select
          className="form-select form-select-sm"
          defaultValue=""
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
  )
}

function CourierJobRow({
  job,
  assignment,
  expanded,
  onToggleExpanded,
  onUnassign,
  onToggleRecipient,
}: {
  job: ActiveJobNoPlan
  assignment: Assignment
  expanded: boolean
  onToggleExpanded: () => void
  onUnassign: () => void
  onToggleRecipient: (workerId: string) => void
}) {
  const recipients = job.workers.filter(w => assignment.recipientIds.has(w.id))
  return (
    <div className="list-group-item py-2 px-2">
      <div className="d-flex justify-content-between align-items-start">
        <div className="flex-grow-1 pe-2">
          <div className="fw-semibold small">{job.proposedJob.name}</div>
          <div className="text-muted small">{job.proposedJob.address}</div>
          <div className="small mt-1">
            <i className="fas fa-users me-1"></i>
            Příjemci: {recipients.length}/{job.workers.length}
            {recipients.length > 0 && (
              <span className="ms-1 text-muted">
                (
                {recipients.map(r => `${r.firstName} ${r.lastName}`).join(', ')}
                )
              </span>
            )}
          </div>
        </div>
        <div className="btn-group btn-group-sm">
          <button
            className="btn btn-outline-secondary"
            onClick={onToggleExpanded}
            title="Upravit příjemce"
          >
            <i className={`fas fa-chevron-${expanded ? 'up' : 'down'}`}></i>
          </button>
          <button
            className="btn btn-outline-danger"
            onClick={onUnassign}
            title="Odebrat z rozvozu"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>
      {expanded && (
        <div className="mt-2 ps-2 border-start">
          <RecipientPicker
            workers={job.workers}
            selectedIds={assignment.recipientIds}
            onToggle={onToggleRecipient}
          />
        </div>
      )}
    </div>
  )
}
