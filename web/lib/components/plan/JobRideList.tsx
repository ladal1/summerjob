import { ActiveJobNoPlan } from 'lib/types/active-job'
import { RideComplete } from 'lib/types/ride'
import DeleteRideButton from './DeleteRideButton'

interface JobRideListProps {
  job: ActiveJobNoPlan
  otherJobs: ActiveJobNoPlan[]
  reloadPlan: () => void
}

export default function JobRideList({
  job,
  otherJobs,
  reloadPlan,
}: JobRideListProps) {
  if (!job.rides || job.rides.length == 0) {
    if (!job.proposedJob.area.requiresCar) {
      return <div className="text-muted">Tato oblast nevyžaduje dopravu.</div>
    }
    return <div className="text-muted">Zatím nejsou naplánovány jízdy.</div>
  }

  const formatSingleRide = (ride: RideComplete, index: number) => {
    const passengersFromOtherJobsIds = ride.passengers
      .filter(p => !job.workers.map(w => w.id).includes(p.id))
      .map(p => p.id)
    const passengersFromOtherJobsData = []
    for (const otherJob of otherJobs) {
      const workersInThisRide = otherJob.workers.filter(w =>
        passengersFromOtherJobsIds.includes(w.id)
      )
      if (workersInThisRide.length == 0) continue
      passengersFromOtherJobsData.push({
        jobName: otherJob.proposedJob.name,
        passengers: workersInThisRide,
      })
    }
    return (
      <>
        <div className="row">
          <div className="col-auto pe-0">
            {index + 1}
            {')'} {ride.car.name}: {ride.driver.firstName}{' '}
            {ride.driver.lastName} (obsazenost: {ride.passengers.length + 1}/
            {ride.car.seats})
          </div>
          <div className="col">
            <DeleteRideButton ride={ride} onSuccess={reloadPlan} />
          </div>
        </div>

        {passengersFromOtherJobsData.length > 0 && (
          <div className="row ms-4 mt-0 text-muted">
            <div className="col-auto p-0">
              <i className="fas fa-person-digging" />
            </div>
            <div className="col">
              {passengersFromOtherJobsData.map<React.ReactNode>(data => (
                <div
                  className="row"
                  key={`rideinfo-${ride.id}-${data.jobName}`}
                >
                  <div className="col">
                    {data.jobName}:{' '}
                    <i>
                      {data.passengers
                        .map(p => `${p.firstName} ${p.lastName}`)
                        .join(', ')}
                    </i>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <>
      {job.rides.map((r, index) => (
        <span key={r.id}>{formatSingleRide(r, index)}</span>
      ))}
    </>
  )
}
