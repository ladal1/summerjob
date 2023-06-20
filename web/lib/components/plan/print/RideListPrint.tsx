import { ActiveJobNoPlan } from 'lib/types/active-job'
import { RideComplete } from 'lib/types/ride'
import React from 'react'

interface RideListPrintProps {
  job: ActiveJobNoPlan
  otherJobs: ActiveJobNoPlan[]
}

export default function RideListPrint({ job, otherJobs }: RideListPrintProps) {
  const formatSingleRide = (ride: RideComplete, fromJobId?: string) => {
    const passengersFromOtherJobsIds = ride.passengers
      .filter(p => !job.workers.map(w => w.id).includes(p.id))
      .map(p => p.id)
    const passengersFromOtherJobsData = []
    for (const otherJob of otherJobs) {
      const workersInThisRide = otherJob.workers.filter(w =>
        passengersFromOtherJobsIds.includes(w.id)
      )
      if (workersInThisRide.length == 0) continue
      for (const worker of workersInThisRide) {
        passengersFromOtherJobsData.push({
          jobId: otherJob.id,
          passenger: worker,
        })
      }
    }
    const passengersFromThisJob = ride.passengers.filter(p =>
      job.workers.map(w => w.id).includes(p.id)
    )
    return (
      <>
        <div className="ride">
          <div className="ride-name">
            {ride.car.name} {fromJobId && <i>[{fromJobId}]</i>}
          </div>
          <div className="driver-name d-flex">
            <div className="w-50">
              {ride.driver.firstName} {ride.driver.lastName}
            </div>
            <div className="w-50 ms-2">{ride.driver.phone}</div>
          </div>
          {passengersFromThisJob.map(p => (
            <div className="ms-2 d-flex" key={`rideinfo-${ride.id}-${p.id}`}>
              <div className="w-50">
                {p.firstName} {p.lastName}
              </div>
              <div className="w-50">{p.phone}</div>
            </div>
          ))}
          {!fromJobId && passengersFromOtherJobsData.length > 0 && (
            <>
              {passengersFromOtherJobsData.map<React.ReactNode>(data => (
                <div
                  className="ms-2 d-flex"
                  key={`rideinfo-${ride.id}-${data.jobId}-${data.passenger.id}`}
                >
                  <div className="w-50">
                    <i>[{data.jobId}] </i>
                    {data.passenger.firstName} {data.passenger.lastName}
                  </div>
                  <div className="w-50">{data.passenger.phone}</div>
                </div>
              ))}
            </>
          )}
          {fromJobId && passengersFromOtherJobsData.length > 0 && (
            <div className="ms-2 d-flex">
              <i>
                ... {passengersFromOtherJobsData.length} dalších z jiného jobu
              </i>
            </div>
          )}
        </div>
      </>
    )
  }

  // Find rides from other jobs that transport workers from this job
  const ridesFromOtherJobs = []
  for (const otherJob of otherJobs) {
    for (const ride of otherJob.rides) {
      const passengersFromThisJob = ride.passengers.filter(p => {
        return job.workers.map(w => w.id).includes(p.id)
      })
      if (passengersFromThisJob.length > 0) {
        ridesFromOtherJobs.push({
          jobId: otherJob.id,
          ride: ride,
          passengers: passengersFromThisJob,
        })
      }
    }
  }

  // Workers that don't have a ride from this job or other jobs
  const localPassengerIds = job.rides
    .flatMap(r => r.passengers)
    .map(p => p.id)
    .concat(...job.rides.map(r => r.driver.id))
  const otherPassengerIds = ridesFromOtherJobs
    .flatMap(r => r.passengers)
    .map(p => p.id)
  const workersWithoutRide = job.workers.filter(
    w => !localPassengerIds.includes(w.id) && !otherPassengerIds.includes(w.id)
  )

  const explanationForWorkersWithoutRide = job.proposedJob.area.requiresCar
    ? '- Chybí doprava!'
    : ''

  return (
    <div className="ms-1">
      {job.rides.map(r => (
        <span key={r.id}>{formatSingleRide(r)}</span>
      ))}
      {ridesFromOtherJobs.map(r => (
        <span key={r.ride.id}>{formatSingleRide(r.ride, r.jobId)}</span>
      ))}
      {workersWithoutRide.length > 0 && (
        <div className="ride">
          <div className="ride-name">
            Pěšky {explanationForWorkersWithoutRide}
          </div>
          <div className="driver-name d-flex"></div>
          {workersWithoutRide.map(w => (
            <div className="ms-2 d-flex" key={`rideinfo-noride-${w.id}`}>
              <div className="w-50">
                {w.firstName} {w.lastName}
              </div>
              <div className="w-50">{w.phone}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
