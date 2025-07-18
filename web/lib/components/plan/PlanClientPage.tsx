'use client'
import ErrorPage from 'lib/components/error-page/ErrorPage'
import { toolNameMapping } from 'lib/data/enumMapping/toolNameMapping'
import { Modal, ModalSize } from 'lib/components/modal/Modal'
import PageHeader from 'lib/components/page-header/PageHeader'
import AddJobToPlanForm from 'lib/components/plan/AddJobToPlanForm'
import { PlanTable } from 'lib/components/plan/PlanTable'
import { SortOrder } from 'lib/components/table/SortableTable'
import {
  useAPIPlan,
  useAPIPlanDelete,
  useAPIPlanGenerate,
  useAPIPlanPublish,
} from 'lib/fetcher/plan'
import { useAPIWorkersWithoutJob } from 'lib/fetcher/worker'
import {
  filterUniqueById,
  formatDateLong,
  normalizeString,
} from 'lib/helpers/helpers'
import { ActiveJobNoPlan } from 'lib/types/active-job'
import { deserializePlan, PlanComplete } from 'lib/types/plan'
import { Serialized } from 'lib/types/serialize'
import { deserializeWorkers, WorkerComplete } from 'lib/types/worker'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import ErrorPage404 from '../404/404'
import { Filters } from '../filters/Filters'
import ConfirmationModal from '../modal/ConfirmationModal'
import ErrorMessageModal from '../modal/ErrorMessageModal'
import { PhotoViewer } from '../photo/PhotoViewer'
import { PlanStatistics } from './PlanStatistics'

interface PlanClientPageProps {
  id: string
  initialDataPlan: Serialized
  initialDataJoblessWorkers: Serialized
  workerId: string
}

export default function PlanClientPage({
  id,
  initialDataPlan,
  initialDataJoblessWorkers,
  workerId,
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

  //#region Adoration data
  const [adorationByWorker, setAdorationByWorker] = useState<Map<string, boolean>>(new Map())

  useEffect(() => {
    if (!planData) return

    const fetchAdorationData = async () => {
      try {
        // Fetch all adoration slots for the plan day
        const response = await fetch(`/api/adoration/admin?date=${planData.day.toISOString().slice(0, 10)}&eventId=${planData.summerJobEventId}`)
        if (!response.ok) return

        const slots = await response.json()
        const workerAdorationMap = new Map<string, boolean>()

        // Process slots to find workers with adoration during work hours (8:00-18:00)
        slots.forEach((slot: { dateStart: string; length: number; workers: { id: string }[] }) => {
          const slotStart = new Date(slot.dateStart)
          const slotEnd = new Date(slotStart.getTime() + slot.length * 60 * 1000)
          
          const dayStart = new Date(planData.day)
          dayStart.setHours(8, 0, 0, 0)
          const dayEnd = new Date(planData.day)
          dayEnd.setHours(18, 0, 0, 0)

          // Check if slot overlaps with working hours
          if (slotStart < dayEnd && slotEnd > dayStart) {
            slot.workers.forEach((worker: { id: string }) => {
              workerAdorationMap.set(worker.id, true)
            })
          }
        })

        setAdorationByWorker(workerAdorationMap)
      } catch (error) {
        console.error('Failed to fetch adoration data:', error)
      }
    }

    fetchAdorationData()
  }, [planData])
  //#endregion

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
    if (planData) triggerGenerate({ planId: planData.id })
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
  } = useAPIPlanDelete(planData?.id ?? '', {
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

  const { trigger: triggerPublish, error: publishError } = useAPIPlanPublish(
    planData?.id ?? '',
    {}
  )

  const switchPublish = () => {
    if (!planData) return
    planData.published = !planData.published
    triggerPublish({ published: planData.published })
  }

  //#endregion Publish plan

  //#region Filter and search jobs

  const searchableJobs = useMemo(() => {
    const map = new Map<string, string>()
    planData?.jobs.forEach(job => {
      const workerNames = job.workers
        .map(w => `${w.firstName} ${w.lastName}`)
        .join(' ')
      const toolsToTakeWith = [...job.proposedJob.toolsToTakeWith]
        .sort((a, b) => toolNameMapping[a.tool].localeCompare(toolNameMapping[b.tool]))
        .map(tool => toolNameMapping[tool.tool])
        .join(' ')
      map.set(
        job.id,
        normalizeString(
          job.proposedJob.name +
            ';' +
            (job.proposedJob.area?.name ?? 'Nezadaná oblast') +
            ';' +
            job.proposedJob.address +
            ';' +
            job.proposedJob.contact +
            ';' +
            workerNames +
            ';' +
            toolsToTakeWith
        )
      )
    })
    return map
  }, [planData?.jobs])

  // get query parameters
  const searchParams = useSearchParams()
  const areaIdQ = searchParams?.get('area')
  const contactQ = searchParams?.get('contact')
  const searchQ = searchParams?.get('search')
  const showNumbersQ = searchParams?.get('showNumbers') === 'true'
  const sortColumnQ = searchParams?.get('sortColumn')
  const sortDirectionQ = searchParams?.get('sortDirection') as 'asc' | 'desc' | null

  // area
  const areas = useMemo(
    () => getAvailableAreas(planData ?? undefined),
    [planData]
  )

  const [selectedArea, setSelectedArea] = useState(
    areas.find(a => a.id === areaIdQ) || areas[0]
  )
  const onAreaSelected = (id: string) => {
    setSelectedArea(areas.find(a => a.id === id) || areas[0])
  }

  // contact
  const contacts = useMemo(
    () => getAvailableContacts(planData ?? undefined),
    [planData]
  )

  const [selectedContact, setSelectedContact] = useState(
    contacts.find(a => a.id === contactQ) || contacts[0]
  )
  const onContactSelected = (id: string) => {
    setSelectedContact(contacts.find(a => a.id === id) || contacts[0])
  }

  // search
  const [filter, setFilter] = useState(searchQ ?? '')

  // show numbers checkbox
  const [showNumbers, setShowNumbers] = useState(showNumbersQ)

  // sort order
  const [sortOrder, setSortOrder] = useState<SortOrder>({
    columnId: sortColumnQ || 'name',
    direction: sortDirectionQ || 'asc',
  })

  const onSortOrderChange = (newSortOrder: SortOrder) => {
    setSortOrder(newSortOrder)
  }

  // replace url with new query parameters
  const router = useRouter()
  useEffect(() => {
    const params = new URLSearchParams({
      area: selectedArea.id,
      contact: selectedContact.id,
      search: filter,
      showNumbers: showNumbers.toString(),
    })
    
    // Only add sort parameters if they're not defaults
    if (sortOrder.columnId !== 'name' || sortOrder.direction !== 'asc') {
      params.append('sortColumn', sortOrder.columnId || 'name')
      params.append('sortDirection', sortOrder.direction)
    }
    
    router.replace(`?${params}`, { scroll: false })
  }, [selectedArea, selectedContact, filter, showNumbers, sortOrder, router])

  const [workerPhotoURL, setWorkerPhotoURL] = useState<string | null>(null)

  const shouldShowJob = useCallback(
    (job: ActiveJobNoPlan) => {
      const isInArea =
        selectedArea.id === areas[0].id ||
        job.proposedJob.area?.id === selectedArea.id
      const includesContact =
        selectedContact.id === contacts[0].id ||
        job.proposedJob.contact === selectedContact.id
      const searchableTokens = searchableJobs.get(job.id)?.split(';')
      if (searchableTokens) {
        return (
          isInArea &&
          includesContact &&
          normalizeString(filter)
            .trimEnd()
            .split(';')
            .every(filterToken =>
              searchableTokens.find(x =>
                x.includes(filterToken.toLocaleLowerCase())
              )
            )
        )
      }
      return isInArea
    },
    [
      selectedArea.id,
      areas,
      selectedContact.id,
      contacts,
      searchableJobs,
      filter,
    ]
  )

  const filteredJobs = useMemo(() => {
    if (!planData) return []
    return planData.jobs.filter(job => {
      return shouldShowJob(job)
    })
  }, [planData, shouldShowJob])

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
            title={planData ? formatDateLong(planData?.day) : 'Načítání...'}
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
            <Link href={`/plan/${planData?.id}/food-delivery`} prefetch={false}>
              <button className="btn btn-warning btn-with-icon" type="button">
                <i className="fas fa-utensils"></i>
                <span>Rozvoz jídla</span>
              </button>
            </Link>
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
                  <Filters
                    search={filter}
                    onSearchChanged={setFilter}
                    selects={[
                      {
                        id: 'contact',
                        options: contacts,
                        selected: selectedContact,
                        onSelectChanged: onContactSelected,
                        defaultOptionId: 'all',
                      },
                      {
                        id: 'area',
                        options: areas,
                        selected: selectedArea,
                        onSelectChanged: onAreaSelected,
                        defaultOptionId: 'all',
                      },
                    ]}
                    checkboxes={[
                      {
                        id: 'showNumbers',
                        label: 'Zobrazit čísla jobů',
                        checked: showNumbers,
                        onCheckboxChanged: setShowNumbers,
                      },
                    ]}
                  />
                </div>
              </div>
              <div className="row gx-3">
                <div className="col-lg-10 pb-2">
                  <PlanTable
                    plan={planData}
                    shouldShowJob={shouldShowJob}
                    joblessWorkers={workersWithoutJob || []}
                    reloadJoblessWorkers={reloadJoblessWorkers}
                    reloadPlan={reloadPlan}
                    onHover={setWorkerPhotoURL}
                    adorationByWorker={adorationByWorker}
                    showNumbers={showNumbers}
                    sortOrder={sortOrder}
                    onSortOrderChange={onSortOrderChange}
                  />
                </div>
                <div className="col-sm-12 col-lg-2">
                  <PlanStatistics
                    data={filteredJobs}
                    workersWithoutJob={workersWithoutJob}
                  />
                  <PhotoViewer photoURL={workerPhotoURL} alt="Pracant" />
                </div>
              </div>
            </div>
            {isJobModalOpen && planData && (
              <Modal
                title={'Přidat joby do plánu'}
                size={ModalSize.LARGE}
                onClose={closeModal}
              >
                <AddJobToPlanForm
                  planId={id}
                  planDate={planData.day}
                  workerId={workerId}
                  onComplete={closeModal}
                />
              </Modal>
            )}
            {showDeleteConfirmation && !deleteError && (
              <ConfirmationModal
                onConfirm={deletePlan}
                onReject={() => setShowDeleteConfirmation(false)}
              >
                <p>Opravdu chcete smazat tento plán?</p>
                {planData && planData.jobs.length > 0 && (
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

function getAvailableContacts(plan?: PlanComplete) {
  const ALL_CONTACTS = { id: 'all', name: 'Vyberte kontakt' }
  const UNKNOWN_CONTACTS = { id: 'unknown', name: 'Neznámý kontakt' }
  const jobs = plan?.jobs.flatMap(j => j.proposedJob)
  const contacts = filterUniqueById(
    jobs?.map(job =>
      job.contact ? { id: job.contact, name: job.contact } : UNKNOWN_CONTACTS
    ) || []
  )
  contacts.sort((a, b) => a.name.localeCompare(b.name))
  contacts.unshift(ALL_CONTACTS)
  return contacts
}

function isWorkerAvailable(worker: WorkerComplete, day: Date) {
  const isWorkDay = worker.availability.workDays
    .map(d => d.getTime())
    .includes(day.getTime())
  
  // Workers with adoration are still available for work, they just get a visual indicator
  return isWorkDay
}
