import type { ActiveJobComplete } from 'lib/types/active-job'
import { WorkerBasicInfo } from 'lib/types/worker'
import React from 'react'

type RidesListProps = {
  job: ActiveJobComplete
}

export default function RidesList({ job }: RidesListProps) {
  return (
    <>
      <div className="list-group">
        {job.rides.map(ride => {
          return (
            <div
              key={ride.id}
              className="list-group-item list-group-item-action p-2"
            >
              <span>
                <b>Auto:</b> {ride.car.name}
                <i>
                  ({ride.driver.firstName} {ride.driver.lastName})
                </i>
              </span>
              <br />
              <b>Obsazeno:</b> {ride.passengers.length + 1}/{ride.car.seats}
              <br />
              <b>Cestující:</b>{' '}
              {[ride.driver, ...ride.passengers]
                .map<React.ReactNode>(p => formatPassengerName(p, job))
                .reduce((acc, curr) => [acc, ', ', curr])}
            </div>
          )
        })}
      </div>
    </>
  )
}

function formatPassengerName(
  passenger: WorkerBasicInfo,
  job: ActiveJobComplete
) {
  const isPassengerWorker = job.workers.some(w => w.id === passenger.id)
  return isPassengerWorker ? (
    <span key={passenger.id}>
      {passenger.firstName} {passenger.lastName}
    </span>
  ) : (
    <i key={passenger.id}>
      {passenger.firstName} {passenger.lastName}
    </i>
  )
}
