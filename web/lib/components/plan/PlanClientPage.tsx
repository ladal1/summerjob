'use client'
import ErrorPage from 'lib/components/error-page/ErrorPage'
import AddJobToPlanForm from 'lib/components/plan/AddJobToPlanForm'
import { Modal, ModalSize } from 'lib/components/modal/Modal'
import PageHeader from 'lib/components/page-header/PageHeader'
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
import { useCallback, useEffect, useMemo, useState } from 'react'
import ErrorPage404 from '../404/404'
import ConfirmationModal from '../modal/ConfirmationModal'
import ErrorMessageModal from '../modal/ErrorMessageModal'
import { Serialized } from 'lib/types/serialize'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Filters } from '../filters/Filters'
import { toolNameMapping } from 'lib/data/enumMapping/toolNameMapping'
import { ToolName } from 'lib/prisma/client'

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
        .join(';')
      map.set(
        job.id,
        (
          job.proposedJob.name +
          ';' +
          (job.proposedJob.area?.name ?? 'Nezadaná oblast') +
          ';' +
          job.proposedJob.address +
          ';' +
          job.proposedJob.contact +
          ';' +
          workerNames
        ).toLocaleLowerCase()
      )
    })
    return map
  }, [planData?.jobs])

  // get query parameters
  const searchParams = useSearchParams()
  const areaIdQ = searchParams?.get("area")
  const contactQ = searchParams?.get("contact")
  const searchQ = searchParams?.get("search")

  // area
  const areas = useMemo(
    () => getAvailableAreas(planData ?? undefined),
    [planData]
  )

  const [selectedArea, setSelectedArea] = useState(areas.find(a => a.id === areaIdQ) || areas[0])
  const onAreaSelected = (id: string) => {
    setSelectedArea(areas.find(a => a.id === id) || areas[0])
  }

  // contact
  const contacts = useMemo(
    () => getAvailableContacts(planData ?? undefined),
    [planData]
  )

  const [selectedContact, setSelectedContact] = useState(contacts.find(a => a.id === contactQ) || contacts[0])
  const onContactSelected = (id: string) => {
    setSelectedContact(contacts.find(a => a.id === id) || contacts[0])
  }

  // search
  const [filter, setFilter] = useState(searchQ ?? '')

  // replace url with new query parameters
  const router = useRouter()
  useEffect(() => {
    router.replace(`?${new URLSearchParams({
      area: selectedArea.id,
      contact: selectedContact.id,
      search: filter
    })}`, {
      scroll: false
    })
  }, [selectedArea, selectedContact, filter, router])

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
          filter
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
    [selectedArea.id, areas, selectedContact.id, contacts, searchableJobs, filter]
  )

  //#endregion

  if (error && !planData) {
    return <ErrorPage error={error} />
  }
  
  interface Tool {
    name: ToolName
    amount: number
  }
  
  interface ToolsList {
    [key: string]: Tool
  }

  const toolsToTakeWithList: ToolsList = planData?.jobs.reduce((accumulator: ToolsList, job) => {
    job.proposedJob.toolsToTakeWith.forEach(({ tool: name, amount }) => {
      accumulator[name] = {
        name,
        amount: (accumulator[name]?.amount || 0) + amount,
      }
    })
    return accumulator
  }, {}) || {}

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
                        defaultOptionId: 'all'
                      },
                      {
                        id: 'area',
                        options: areas,
                        selected: selectedArea,
                        onSelectChanged: onAreaSelected,
                        defaultOptionId: 'all'
                      },
                    ]}
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
                    onHover={setWorkerPhotoURL}
                  />
                </div>
                <div className="col-sm-12 col-lg-2">
                  <div className="vstack smj-search-stack smj-shadow rounded-3">
                    <h5>Statistiky</h5>
                    <hr />
                    <ul className="list-group list-group-flush">
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
                      <li className="list-group-item ps-0 pe-0 smj-gray">
                        Potřebné nástroje
                        <table className="table">
                          <tbody>
                            {Object.entries(toolsToTakeWithList).map(([key, tool]) => (
                              <tr key={key} className="text-end">
                                <td>{toolNameMapping[tool.name]}</td>
                                <td>{tool.amount}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </li>
                    </ul>
                  </div>
                  <div
                    className="smj-search-stack smj-shadow rounded-3"
                    style={{
                      width: '100%',
                      maxWidth: '100%',
                      padding: '10px',
                      top: '20px',
                      position: 'sticky',
                    }}
                  >
                    <h5 style={{ paddingLeft: '12px', paddingTop: '12px' }}>
                      Foto
                    </h5>
                    <hr />
                    {workerPhotoURL ? (
                      <Image
                        src={workerPhotoURL}
                        alt="Pracant"
                        style={{
                          objectFit: 'cover',
                          width: '100%',
                          height: '100%',
                        }}
                        width={500}
                        height={500}
                      />
                    ) : (
                      <svg
                        viewBox="0 0 64 64"
                        xmlns="http://www.w3.org/2000/svg"
                        strokeWidth="3"
                        stroke="#000000"
                        fill="none"
                      >
                        <circle cx="32" cy="18.14" r="11.14" />
                        <path d="M54.55,56.85A22.55,22.55,0,0,0,32,34.3h0A22.55,22.55,0,0,0,9.45,56.85Z" />
                      </svg>
                    )}
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
                <AddJobToPlanForm planId={id} workerId={workerId} onComplete={closeModal} />
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
  return worker.availability.workDays
    .map(d => d.getTime())
    .includes(day.getTime())
}
