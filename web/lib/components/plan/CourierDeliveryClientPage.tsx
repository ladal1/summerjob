'use client'

import ErrorPage from 'lib/components/error-page/ErrorPage'
import PageHeader from 'lib/components/page-header/PageHeader'
import { formatDateLong } from 'lib/helpers/helpers'
import { foodAllergyMapping } from 'lib/data/enumMapping/foodAllergyMapping'
import Link from 'next/link'
import { useMemo, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import ErrorPage404 from '../404/404'
import { useFoodDeliveryDetail } from 'lib/fetcher/food-delivery'
import { ActiveJobNoPlan } from 'lib/types/active-job'

const JobsMapView = dynamic(() => import('./JobsMapView'), { ssr: false })

interface CourierDeliveryClientPageProps {
  planId: string
  courierId: string
  initialDataPlan?: unknown // Plan data from server-side rendering
}

export default function CourierDeliveryClientPage({
  planId,
  courierId,
  initialDataPlan,
}: CourierDeliveryClientPageProps) {
  // Get delivery data with plan data
  const {
    data: deliveryData,
    error,
    mutate: mutateDeliveryData,
    isLoading
  } = useFoodDeliveryDetail(planId, courierId, {
    fallbackData: initialDataPlan,
  })

  // Extract plan data and delivery data
  const planData = deliveryData?.plan || null
  const courierDelivery = deliveryData?.delivery || null

  // Get the courier number for display purposes
  const courierNum = courierDelivery?.courierNum

  // Get jobs for this courier with their order
  const courierJobs = useMemo(() => {
    if (!courierDelivery || !planData) return []
    
    return courierDelivery.jobs
      .map(jobOrder => {
        const job = planData.jobs.find(j => j.id === jobOrder.activeJobId)
        if (!job) return null
        
        return {
          job,
          order: jobOrder.order,
          completed: jobOrder.completed,
          jobOrderId: jobOrder.id,
          workersWithAllergies: job.workers
            .filter(worker => worker.foodAllergies.length > 0)
            .map(worker => ({
              id: worker.id,
              firstName: worker.firstName,
              lastName: worker.lastName,
              phone: worker.phone,
              age: worker.age || undefined,
              allergies: worker.foodAllergies.map(allergy => foodAllergyMapping[allergy])
            })),
          needsFoodDelivery: !job.proposedJob.hasFood,
          hasWorkersWithAllergies: job.workers.some(worker => worker.foodAllergies.length > 0)
        }
      })
      .filter(item => item !== null)
      .sort((a, b) => a!.order - b!.order)
  }, [courierDelivery, planData])

  // State for UI feedback
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [saveMessageType, setSaveMessageType] = useState<'success' | 'error'>('success')
  const [isOperationLoading, setIsOperationLoading] = useState(false)
  const [showMap, setShowMap] = useState(false)

  // Function to mark job delivery as complete/incomplete
  const toggleJobCompletion = useCallback(async (jobOrderId: string, currentStatus: boolean) => {
    setIsOperationLoading(true)
    try {
      const response = await fetch(`/api/plans/${planId}/food-deliveries/job-orders/${jobOrderId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completed: !currentStatus
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update job completion status')
      }
      
      // Refresh the data and wait for it to complete
      await mutateDeliveryData(undefined, { revalidate: true })
      
      setSaveMessage(`Dodávka byla ${!currentStatus ? 'označena jako hotová' : 'označena jako nedokončená'}.`)
      setSaveMessageType('success')
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error) {
      console.error('Failed to update job completion:', error)
      setSaveMessage('Chyba při aktualizaci stavu dodávky.')
      setSaveMessageType('error')
      setTimeout(() => setSaveMessage(null), 5000)
    } finally {
      setIsOperationLoading(false)
    }
  }, [planId, mutateDeliveryData])

  // Function to generate Google Maps link
  const getGoogleMapsLink = useCallback((job: { proposedJob: { coordinates: number[] | null } }) => {
    if (!job.proposedJob.coordinates || job.proposedJob.coordinates.length < 2) {
      return null
    }
    
    const [lat, lng] = job.proposedJob.coordinates
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
  }, [])

  // Show loading state while data is being fetched
  if (isLoading && !deliveryData) {
    return (
      <div className="container-fluid">
        <div className="text-center py-5">
          <i className="fas fa-spinner fa-spin fa-2x mb-3"></i>
          <div>Načítání dat rozvozníka...</div>
        </div>
      </div>
    )
  }

  // Show error if there's an error and no data
  if (error && !planData) {
    return <ErrorPage error={error} />
  }

  // Show 404 if delivery data is loaded but courier not found
  if (deliveryData !== undefined && !courierDelivery) {
    return <ErrorPage404 message={`Rozvozník s ID ${courierId} nebyl nalezen v tomto plánu.`} />
  }

  // Show 404 if delivery data is loaded but plan not found
  if (deliveryData !== undefined && !planData) {
    return <ErrorPage404 message="Plán nenalezen." />
  }

  return (
    <>
      <PageHeader
        title={`Rozvozník ${courierNum} - ${planData ? formatDateLong(new Date(planData.day)) : 'Načítání...'}`}
      >
        <div className="d-flex flex-column flex-md-row gap-2">
          <Link href={`/plan/${planId}/food-delivery`}>
            <button className="btn btn-secondary btn-with-icon w-100" type="button">
              <i className="fas fa-arrow-left"></i>
              <span>Zpět na správu rozvozu</span>
            </button>
          </Link>
          {courierJobs.length > 0 && (
            <button
              className="btn btn-info btn-with-icon w-100"
              type="button"
              onClick={() => setShowMap(!showMap)}
            >
              <i className="fas fa-map"></i>
              <span>{showMap ? 'Skrýt mapu' : 'Zobrazit mapu'}</span>
            </button>
          )}
        </div>
      </PageHeader>

      <section>
        <div className="container-fluid">
          {/* Display save/error messages */}
          {saveMessage && (
            <div className="row mb-4">
              <div className="col">
                <div className={`alert ${saveMessageType === 'success' ? 'alert-success' : 'alert-danger'} alert-dismissible fade show`}>
                  <i className={`fas ${saveMessageType === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'} me-2`}></i>
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
          {error && (
            <div className="row mb-4">
              <div className="col">
                <div className="alert alert-danger">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  <strong>Chyba při načítání dodávek:</strong>
                  <br />
                  {error.message || 'Neznámá chyba'}
                </div>
              </div>
            </div>
          )}

          {/* Show loading state during data refresh */}
          {isOperationLoading && (
            <div className="row mb-4">
              <div className="col">
                <div className="alert alert-info">
                  <i className="fas fa-spinner fa-spin me-2"></i>
                  Aktualizuji data...
                </div>
              </div>
            </div>
          )}

          {courierJobs.length === 0 ? (
            <div className="text-center py-5">
              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                Rozvozník {courierNum} nemá přiřazené žádné joby.
              </div>
            </div>
          ) : (
            <>
              {/* Map View */}
              {showMap && planData && (
                    <div className="row mb-4">
                      <div className="col-12">
                        <div className="card">
                          <div className="card-header">
                            <h5 className="mb-0">
                              <i className="fas fa-map me-2"></i>
                              Mapa všech dodávek rozvozníka {courierNum}
                            </h5>
                          </div>
                          <div className="card-body p-3" style={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ flex: 1, width: '100%' }}>
                              {(() => {
                                const jobOrder: { [jobId: string]: number } = {}
                                courierJobs.forEach(({ job, order }) => {
                                  jobOrder[job.id] = order
                                })
                                
                                return (
                                  <JobsMapView 
                                    jobs={courierJobs.map(({ job }) => job) as unknown as ActiveJobNoPlan[]}
                                    jobOrder={jobOrder}
                                  />
                                )
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Delivery Summary */}
                  <div className="row mb-4">
                    <div className="col">
                      <div className="card border-primary">
                        <div className="card-header bg-primary text-white">
                          <h5 className="card-title mb-0">
                            <i className="fas fa-truck me-2"></i>
                            Přehled dodávek - Rozvozník {courierNum}
                          </h5>
                        </div>
                        <div className="card-body">
                          <div className="row text-center g-2">
                            <div className="col-6 col-md-3">
                              <div className="border rounded p-2 p-md-3">
                                <div className="h3 h2-md mb-1 text-danger">
                                  {(() => {
                                    let allergenFreeMeals = 0
                                    
                                    courierJobs.forEach(({ workersWithAllergies, needsFoodDelivery }) => {
                                      const allergicWorkersCount = workersWithAllergies.length
                                      
                                      if (needsFoodDelivery) {
                                        allergenFreeMeals += allergicWorkersCount
                                      } else {
                                        allergenFreeMeals += allergicWorkersCount
                                      }
                                    })
                                    
                                    return allergenFreeMeals
                                  })()}
                                </div>
                                <div className="small text-muted">Bezalergenní jídla</div>
                              </div>
                            </div>
                            <div className="col-6 col-md-3">
                              <div className="border rounded p-2 p-md-3">
                                <div className="h3 h2-md mb-1 text-success">
                                  {(() => {
                                    let standardMeals = 0
                                    
                                    courierJobs.forEach(({ job, workersWithAllergies, needsFoodDelivery }) => {
                                      const allergicWorkersCount = workersWithAllergies.length
                                      const totalWorkersCount = job.workers.length
                                      const nonAllergicWorkersCount = totalWorkersCount - allergicWorkersCount
                                      
                                      if (needsFoodDelivery) {
                                        standardMeals += nonAllergicWorkersCount
                                      }
                                    })
                                    
                                    return standardMeals
                                  })()}
                                </div>
                                <div className="small text-muted">Běžná jídla</div>
                              </div>
                            </div>
                            <div className="col-6 col-md-3">
                              <div className="border rounded p-2 p-md-3">
                                <div className="h3 h2-md mb-1 text-success">{courierJobs.filter(job => job.completed).length}</div>
                                <div className="small text-muted">Dokončeno</div>
                              </div>
                            </div>
                            <div className="col-6 col-md-3">
                              <div className="border rounded p-2 p-md-3">
                                <div className="h3 h2-md mb-1 text-warning">{courierJobs.filter(job => !job.completed).length}</div>
                                <div className="small text-muted">Zbývá</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Job List */}
                  <div className="row mb-4">
                    <div className="col">
                      <div className="card">
                        <div className="card-header">
                          <h5 className="card-title mb-0">
                            <i className="fas fa-list me-2"></i>
                            Seznam dodávek v pořadí
                          </h5>
                        </div>
                        <div className="card-body p-0">
                          <div className="list-group list-group-flush">
                            {courierJobs.map(({ job, order, completed, jobOrderId, workersWithAllergies, needsFoodDelivery }) => {
                              const googleMapsLink = getGoogleMapsLink(job)
                              
                              return (
                                <div key={job.id} className={`list-group-item ${completed ? 'bg-light' : ''}`}>
                                  <div className="d-flex flex-column d-md-flex flex-md-row justify-content-between align-items-start">
                                    <div className="flex-grow-1 w-100">
                                      <div className="d-flex align-items-center mb-2">
                                        <span className={`badge me-3 job-order-badge ${completed ? 'bg-success' : 'bg-secondary'}`} style={{ fontSize: '1.1em', padding: '0.5rem 0.75rem' }}>
                                          {order}
                                        </span>
                                        <div className="flex-grow-1">
                                          <h6 className={`mb-1 ${completed ? 'text-decoration-line-through text-muted' : ''}`}>
                                            <strong>{job.proposedJob.name}</strong>
                                            {completed && (
                                              <span className="badge bg-success ms-2">
                                                <i className="fas fa-check me-1"></i>
                                                Hotovo
                                              </span>
                                            )}
                                          </h6>
                                          <div className="d-flex flex-column d-md-flex flex-md-row gap-1 gap-md-3 small text-muted">
                                            <span>
                                              <i className="fas fa-map-marker-alt me-1"></i>
                                              {job.proposedJob.area?.name || 'Nezadaná oblast'}
                                            </span>
                                            <span>
                                              <i className="fas fa-home me-1"></i>
                                              {job.proposedJob.address || 'Nezadaná adresa'}
                                            </span>
                                            {job.responsibleWorker && (
                                              <span>
                                                <i className="fas fa-user-tie me-1"></i>
                                                {job.responsibleWorker.firstName} {job.responsibleWorker.lastName}
                                                <a href={`tel:${job.responsibleWorker.phone}`} className="text-decoration-none ms-2">
                                                  <i className="fas fa-phone me-1"></i>
                                                  {job.responsibleWorker.phone}
                                                </a>
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Worker allergies */}
                                      {workersWithAllergies.length > 0 && (
                                        <div className="mb-2">
                                          <div className="small text-muted mb-1">Pracanti s alergiemi:</div>
                                          <div className="d-flex flex-column d-sm-flex flex-sm-row flex-wrap gap-1">
                                            {workersWithAllergies.map((worker) => (
                                              <div key={worker.id} className="worker-allergies-box">
                                                <div className="small fw-bold text-dark">
                                                  {worker.firstName} {worker.lastName}
                                                </div>
                                                <div className="d-flex flex-wrap gap-1 mt-1">
                                                  {worker.allergies.map((allergy, allergyIndex) => (
                                                    <span key={allergyIndex} className="badge bg-danger allergen-badge">
                                                      {allergy}
                                                    </span>
                                                  ))}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Meal count */}
                                      <div className="small text-muted mb-2">
                                        <i className="fas fa-utensils me-1"></i>
                                        {(() => {
                                          const allergicWorkers = job.workers.filter(w => w.foodAllergies.length > 0).length
                                          const totalWorkers = job.workers.length
                                          const nonAllergicWorkers = totalWorkers - allergicWorkers
                                          
                                          if (!job.proposedJob.hasFood) {
                                            return `${allergicWorkers} bezalergenních, ${nonAllergicWorkers} běžných jídel`
                                          } else {
                                            return `${allergicWorkers} bezalergenních jídel (jídlo na místě pro ostatní)`
                                          }
                                        })()}
                                      </div>

                                      {/* Badges */}
                                      {needsFoodDelivery && (
                                        <div>
                                          <span className="badge bg-warning text-dark">
                                            <i className="fas fa-utensils me-1"></i>
                                            Nemá jídlo na místě
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Action buttons */}
                                    <div className="d-flex flex-row d-md-flex flex-md-column gap-2 mt-3 mt-md-0 ms-md-3 w-100 w-md-auto">
                                      <button
                                        className={`btn flex-fill flex-md-fill-none ${completed ? 'btn-warning' : 'btn-success'}`}
                                        onClick={() => toggleJobCompletion(jobOrderId, completed)}
                                        disabled={isOperationLoading}
                                        title={completed ? 'Označit jako nedokončeno' : 'Označit jako hotovo'}
                                      >
                                        <i className={`fas ${completed ? 'fa-undo' : 'fa-check'} me-2`}></i>
                                        {completed ? 'Zrušit' : 'Hotovo'}
                                      </button>
                                      
                                      {googleMapsLink && (
                                        <a
                                          href={googleMapsLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="btn btn-info flex-fill flex-md-fill-none"
                                          title="Otevřít v Google Maps"
                                        >
                                          <i className="fas fa-map-marked-alt me-2"></i>
                                          Navigace
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
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
  )
}
