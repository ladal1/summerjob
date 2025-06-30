import { format } from 'date-fns'
import { MyPlan, WorkerContactSchema } from 'lib/types/my-plan'
import { z } from 'zod'

type WorkerContact = z.infer<typeof WorkerContactSchema>

interface MyAdorationsProps {
  adorations: NonNullable<MyPlan['adorations']>
}

export default function MyAdorations({ adorations }: MyAdorationsProps) {
  if (!adorations || adorations.length === 0) {
    return null
  }

  return (
    <div className="mt-4">
      <div className="d-flex align-items-center mb-3">
        <i className="fas fa-praying-hands text-muted me-2"></i>
        <h4 className="mb-0">Adorace</h4>
      </div>
      
      {adorations.map((adoration, index) => (
        <div key={index} className="card mb-3">
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <h6 className="card-title d-flex align-items-center">
                  <i className="fas fa-clock me-2 text-primary"></i>
                  {format(adoration.startTime, 'HH:mm')} - {format(adoration.endTime, 'HH:mm')}
                </h6>
                <p className="card-text mb-3">
                  <i className="fas fa-map-marker-alt me-2 text-danger"></i>
                  <strong>Místo:</strong> {adoration.location}
                </p>
                
                {/* Same time workers displayed below time and place */}
                {adoration.sameTimeWorkers && adoration.sameTimeWorkers.length > 0 && (
                  <div className="mb-2">
                    <h6 className="mb-2 text-primary">
                      <i className="fas fa-users me-2"></i>
                      Spolu s tebou adorují:
                    </h6>
                    {adoration.sameTimeWorkers.map((worker: WorkerContact, workerIndex: number) => (
                      <div key={workerIndex} className="d-flex justify-content-between align-items-center py-1 mb-1">
                        <span className="text-muted small">
                          {worker.firstName} {worker.lastName}
                        </span>
                        <a 
                          href={`tel:${worker.phone}`} 
                          className="btn btn-sm btn-outline-primary"
                          title={`Zavolat ${worker.firstName} ${worker.lastName}`}
                        >
                          <i className="fas fa-phone me-1"></i>
                          {worker.phone}
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Before/after workers on the right side */}
              <div className="col-md-6">
                {(adoration.previousWorkers && adoration.previousWorkers.length > 0) || 
                 (adoration.nextWorkers && adoration.nextWorkers.length > 0) ? (
                  <div>
                    {adoration.previousWorkers && adoration.previousWorkers.length > 0 && (
                      <div className="mb-3">
                        <h6 className="mb-2">Předchozí:</h6>
                        {adoration.previousWorkers.map((worker: WorkerContact, workerIndex: number) => (
                          <div key={workerIndex} className="d-flex justify-content-between align-items-center py-1 mb-1">
                            <span className="text-muted small">
                              {worker.firstName} {worker.lastName}
                            </span>
                            <a 
                              href={`tel:${worker.phone}`} 
                              className="btn btn-sm btn-outline-primary"
                              title={`Zavolat ${worker.firstName} ${worker.lastName}`}
                            >
                              <i className="fas fa-phone me-1"></i>
                              {worker.phone}
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                    {adoration.nextWorkers && adoration.nextWorkers.length > 0 && (
                      <div>
                        <h6 className="mb-2">Následující:</h6>
                        {adoration.nextWorkers.map((worker: WorkerContact, workerIndex: number) => (
                          <div key={workerIndex} className="d-flex justify-content-between align-items-center py-1 mb-1">
                            <span className="text-muted small">
                              {worker.firstName} {worker.lastName}
                            </span>
                            <a 
                              href={`tel:${worker.phone}`} 
                              className="btn btn-sm btn-outline-primary"
                              title={`Zavolat ${worker.firstName} ${worker.lastName}`}
                            >
                              <i className="fas fa-phone me-1"></i>
                              {worker.phone}
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-muted small mb-0">
                      <i className="fas fa-info-circle me-2"></i>
                      Žádní další účastníci v blízkosti
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
