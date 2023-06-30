'use client'
import ErrorPage from 'lib/components/error-page/ErrorPage'
import AddJobToPlanForm from 'lib/components/plan/AddJobToPlanForm'
import { Modal, ModalSize } from 'lib/components/modal/Modal'
import PageHeader from 'lib/components/page-header/PageHeader'
import { PlanFilters } from 'lib/components/plan/PlanFilters'
import { PlanTable } from 'lib/components/plan/PlanTable'
import {
  useAPIPlan,
  useAPIPlanDelete,
  useAPIPlanGenerate,
  useAPIPlanPublish,
} from 'lib/fetcher/plan'
import { useAPIWorkersWithoutJob } from 'lib/fetcher/worker'
import { filterUniqueById, formatDateLong } from 'lib/helpers/helpers'
import { ActiveJobNoPlan } from 'lib/types/active-job'
import { deserializePlan, PlanComplete } from 'lib/types/plan'
import { deserializeWorkers, WorkerComplete } from 'lib/types/worker'
import { useCallback, useMemo, useState } from 'react'
import ErrorPage404 from '../404/404'
import ConfirmationModal from '../modal/ConfirmationModal'
import ErrorMessageModal from '../modal/ErrorMessageModal'
import { Serialized } from 'lib/types/serialize'
import Link from 'next/link'

interface PlanClientPageProps {
  id: string
  initialDataPlan: Serialized
  initialDataJoblessWorkers: Serialized
}

export default function PlanClientPage({
  id,
  initialDataPlan,
  initialDataJoblessWorkers,
}: PlanClientPageProps) {
  const initialDataPlanParsed = deserializePlan(initialDataPlan)

  const {
    data: planData,
    error,
    mutate,
  } = useAPIPlan(id, {
    fallbackData: initialDataPlanParsed,
  })
  const initialDataJoblessParsed = deserializeWorkers(initialDataJoblessWorkers)
  const { data: workersWithoutJobData, mutate: reloadJoblessWorkers } =
    useAPIWorkersWithoutJob(id, {
      fallbackData: initialDataJoblessParsed,
    })

  const reloadPlan = useCallback(() => mutate(), [mutate])

  const workersWithoutJob = useMemo(() => {
    if (!workersWithoutJobData) return []
    if (!planData) return workersWithoutJobData
    return workersWithoutJobData.filter(w => isWorkerAvailable(w, planData.day))
  }, [planData, workersWithoutJobData])

  const [isJobModalOpen, setIsJobModalOpen] = useState(false)
  const openModal = () => setIsJobModalOpen(true)
  const closeModal = () => {
    mutate()
    setIsJobModalOpen(false)
  }

  //#region Generate plan

  const [showGenerateConfirmation, setShowGenerateConfirmation] =
    useState(false)

  const generatePlan = () => {
    triggerGenerate({ planId: planData!.id })
  }

  const onGeneratingErrorMessageClose = () => {
    resetGenerateError()
    setShowGenerateConfirmation(false)
  }

  //#endregion

  //#region Delete plan

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const {
    trigger: triggerDelete,
    error: deleteError,
    reset: resetDeleteError,
  } = useAPIPlanDelete(planData!.id, {
    onSuccess: () => window.history.back(),
  })

  const deletePlan = () => {
    triggerDelete()
    setShowDeleteConfirmation(false)
  }

  const confirmDelete = () => {
    setShowDeleteConfirmation(true)
  }

  const onErrorMessageClose = () => {
    resetDeleteError()
  }

  //#endregion

  //#region Publish plan
  const {
    trigger: triggerGenerate,
    isMutating: isSendingGenerate,
    error: errorGenerating,
    reset: resetGenerateError,
  } = useAPIPlanGenerate({
    onSuccess: () => {
      setShowGenerateConfirmation(true)
    },
  })

  const {
    trigger: triggerPublish,
    error: publishError,
    reset: resetPublishError,
  } = useAPIPlanPublish(planData!.id, {})

  const switchPublish = () => {
    if (!planData) return
    planData.published = !planData.published
    triggerPublish({ published: planData.published })
  }

  const onPublishErrorMessageClose = () => {
    resetPublishError()
  }

  //#endregion Publish plan

  //#region Filter and search jobs

  const searchableJobs = useMemo(() => {
    const map = new Map<string, string>()
    planData?.jobs.forEach(job => {
      const workerNames = job.workers
        .map(w => `${w.firstName} ${w.lastName}`)
        .join(' ')
      map.set(
        job.id,
        (
          job.proposedJob.name + job.proposedJob.area?.name ??
          'Nezadaná oblast' +
            job.proposedJob.address +
            job.proposedJob.contact +
            workerNames
        ).toLocaleLowerCase()
      )
    })
    return map
  }, [planData?.jobs])

  const areas = useMemo(
    () => getAvailableAreas(planData ?? undefined),
    [planData]
  )
  const [selectedArea, setSelectedArea] = useState(areas[0])

  const onAreaSelected = (id: string) => {
    setSelectedArea(areas.find(a => a.id === id) || areas[0])
  }

  const [filter, setFilter] = useState('')

  const shouldShowJob = useCallback(
    (job: ActiveJobNoPlan) => {
      const isInArea =
        selectedArea.id === areas[0].id ||
        job.proposedJob.area?.id === selectedArea.id
      const text = searchableJobs.get(job.id)
      if (text) {
        return isInArea && text.includes(filter.toLowerCase())
      }
      return isInArea
    },
    [selectedArea, areas, searchableJobs, filter]
  )

  //#endregion

  if (error && !planData) {
    return <ErrorPage error={error} />
  }

  return (
    <>
      {planData === null && <ErrorPage404 message="Plán nenalezen." />}
      {planData !== null && (
        <>
          <PageHeader
            title={
              planData ? formatDateLong(planData?.day, true) : 'Načítání...'
            }
          >
            <button
              className="btn btn-primary btn-with-icon"
              type="button"
              onClick={openModal}
            >
              <i className="fas fa-briefcase"></i>
              <span>Přidat job</span>
            </button>
            <button
              className="btn btn-primary btn-with-icon"
              type="button"
              onClick={generatePlan}
              disabled={isSendingGenerate}
            >
              <i className="fas fa-cog"></i>
              <span>Vygenerovat plán</span>
            </button>
            <button
              className="btn btn-primary btn-with-icon"
              type="button"
              onClick={switchPublish}
            >
              <i className="fas fa-briefcase"></i>
              <span>
                {!planData?.published ? 'Zveřejnit plán' : 'Odzveřejnit plán'}
              </span>
            </button>
            <Link href={`/print-plan/${planData?.id}`} prefetch={false}>
              <button className="btn btn-secondary btn-with-icon" type="button">
                <i className="fas fa-print"></i>
                <span>Tisknout</span>
              </button>
            </Link>
            <button
              className="btn btn-danger btn-with-icon"
              type="button"
              onClick={confirmDelete}
            >
              <i className="fas fa-trash-alt"></i>
              <span>Odstranit</span>
            </button>
          </PageHeader>

          <section>
            <div className="container-fluid">
              <div className="row gx-3">
                <div className="col">
                  <PlanFilters
                    search={filter}
                    onSearchChanged={setFilter}
                    areas={areas}
                    selectedArea={selectedArea}
                    onAreaSelected={onAreaSelected}
                  />
                </div>
              </div>
              <div className="row gx-3">
                <div className="col-sm-12 col-lg-10">
                  <PlanTable
                    plan={planData}
                    shouldShowJob={shouldShowJob}
                    joblessWorkers={workersWithoutJob || []}
                    reloadJoblessWorkers={reloadJoblessWorkers}
                    reloadPlan={reloadPlan}
                  />
                </div>
                <div className="col-sm-12 col-lg-2">
                  <div className="vstack smj-search-stack smj-shadow rounded-3">
                    <h5>Statistiky</h5>
                    <hr />
                    <ul className="list-group list-group-flush ">
                      <li className="list-group-item ps-0 pe-0 d-flex justify-content-between align-items-center smj-gray">
                        Nasazených pracantů
                        <span>
                          {planData?.jobs.flatMap(x => x.workers).length}
                        </span>
                      </li>
                      <li className="list-group-item ps-0 pe-0 d-flex justify-content-between align-items-center smj-gray">
                        Bez práce
                        <span>
                          {workersWithoutJob && workersWithoutJob.length}
                        </span>
                      </li>
                      <li className="list-group-item ps-0 pe-0 d-flex justify-content-between align-items-center smj-gray">
                        Naplánované joby
                        <span>{planData && planData.jobs.length}</span>
                      </li>
                      <li className="list-group-item ps-0 pe-0 d-flex justify-content-between align-items-center smj-gray">
                        Celkem míst v jobech
                        <span>
                          {planData &&
                            planData.jobs
                              .map(j => j.proposedJob.minWorkers)
                              .reduce((a, b) => a + b, 0)}{' '}
                          -{' '}
                          {planData &&
                            planData.jobs
                              .map(j => j.proposedJob.maxWorkers)
                              .reduce((a, b) => a + b, 0)}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            {isJobModalOpen && (
              <Modal
                title={'Přidat joby do plánu'}
                size={ModalSize.LARGE}
                onClose={closeModal}
              >
                <AddJobToPlanForm planId={id} onComplete={closeModal} />
              </Modal>
            )}
            {showDeleteConfirmation && !deleteError && (
              <ConfirmationModal
                onConfirm={deletePlan}
                onReject={() => setShowDeleteConfirmation(false)}
              >
                <p>Opravdu chcete smazat tento plán?</p>
                {planData!.jobs.length > 0 && (
                  <div className="alert alert-danger">
                    Tento plán obsahuje naplánované joby!
                    <br /> Jeho odstraněním zároveň odstraníte i odpovídající
                    naplánované joby.
                  </div>
                )}
              </ConfirmationModal>
            )}
            {deleteError && (
              <ErrorMessageModal
                onClose={onErrorMessageClose}
                mainMessage={'Nepovedlo se odstranit plán.'}
              />
            )}
            {publishError && (
              <ErrorMessageModal
                onClose={onErrorMessageClose}
                mainMessage={'Nepovedlo se (od)zveřejnit plán.'}
              />
            )}
            {showGenerateConfirmation && !errorGenerating && (
              <Modal
                title="Úspěch"
                size={ModalSize.MEDIUM}
                onClose={() => setShowGenerateConfirmation(false)}
              >
                <p>Plán byl zařazen do fronty na generování.</p>
                <button
                  className="btn pt-2 pb-2 btn-primary float-end"
                  onClick={() => setShowGenerateConfirmation(false)}
                >
                  Pokračovat
                </button>
              </Modal>
            )}
            {errorGenerating && (
              <ErrorMessageModal
                onClose={onGeneratingErrorMessageClose}
                mainMessage={'Nepovedlo se vygenerovat plán.'}
              />
            )}
          </section>
        </>
      )}
    </>
  )
}

function getAvailableAreas(plan?: PlanComplete) {
  const ALL_AREAS = { id: 'all', name: 'Vyberte oblast' }
  const UNKNOWN_AREA = { id: 'unknown', name: 'Neznámá oblast' }
  const jobs = plan?.jobs.flatMap(j => j.proposedJob)
  const areas = filterUniqueById(
    jobs?.map(job =>
      job.area ? { id: job.area.id, name: job.area.name } : UNKNOWN_AREA
    ) || []
  )
  areas.sort((a, b) => a.name.localeCompare(b.name))
  areas.unshift(ALL_AREAS)
  return areas
}

function isWorkerAvailable(worker: WorkerComplete, day: Date) {
  return worker.availability.workDays
    .map(d => d.getTime())
    .includes(day.getTime())
}
