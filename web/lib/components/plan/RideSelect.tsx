'use client'
import { useAPIRideUpdateDynamic } from 'lib/fetcher/rides'
import { ActiveJobNoPlan } from 'lib/types/active-job'
import {
  NO_RIDE,
  RideComplete,
  RidesForJob,
  RideUpdateData,
} from 'lib/types/ride'
import { WorkerComplete } from 'lib/types/worker'
import { useEffect, useState } from 'react'

interface RideSelectProps {
  worker: WorkerComplete
  job: ActiveJobNoPlan
  otherRides: RidesForJob[]
  onRideChanged?: () => void
}

export default function RideSelect({
  worker,
  job,
  otherRides,
  onRideChanged,
}: RideSelectProps) {
  const otherJobsRides = otherRides.flatMap(r => r.rides)
  const [selectedRide, setSelectedRide] = useState<RideComplete | undefined>(
    undefined
  )
  const [requestPayload, setRequestPayload] = useState<RideUpdateData>({})
  const { trigger } = useAPIRideUpdateDynamic(() => selectedRide, {
    onSuccess: () => {
      setSelectedRide(undefined)
      onRideChanged?.()
    },
  })

  useEffect(() => {
    if (selectedRide === undefined) {
      return
    }
    trigger(requestPayload)
  }, [selectedRide, trigger, requestPayload])

  const rideFromRideId = (rideId: string) => {
    if (rideId === NO_RIDE) {
      return undefined
    }
    const ride = [...job.rides, ...otherJobsRides].find(r => r.id === rideId)
    return ride
  }

  const onRideSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const rideId = e.target.value
    if (rideId === NO_RIDE) {
      setRequestPayload({
        passengerIds: ride
          ? [...ride.passengers.map(p => p.id).filter(id => id !== worker.id)]
          : [],
      })
      setSelectedRide(ride)
      return
    }
    const newRide = rideFromRideId(rideId)
    setRequestPayload({
      passengerIds: newRide
        ? [...newRide.passengers.map(p => p.id), worker.id]
        : [],
    })
    setSelectedRide(newRide)
  }

  const isInRide = (person: WorkerComplete, ride: RideComplete) => {
    return (
      ride.driverId === person.id ||
      ride.passengers.some(passenger => passenger.id === person.id)
    )
  }

  const ride = [...job.rides, ...otherJobsRides].find(r => isInRide(worker, r))
  const isDriver = ride && ride.driverId === worker.id
  const selectColor = isDriver ? 'bg-grey' : 'bg-white'
  const capacityText = (ride: RideComplete) => {
    return ` (${ride.passengers.length + 1}/${ride.car.seats})`
  }

  const jobNameToShort = (jobName: string) => {
    return jobName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
  }

  return (
    <select
      className={`ps-1 pe-0 pt-0 pb-0 m-0 form-select border ${selectColor}`}
      value={ride === undefined ? NO_RIDE : ride.id}
      disabled={isDriver}
      onChange={onRideSelectionChange}
    >
      <option value={NO_RIDE}>Žádná doprava</option>
      {job.rides.length > 0 && (
        <optgroup label="Tento job">
          {job.rides.map((r, index) => (
            <option key={r.id} value={r.id}>
              {index + 1}
              {') '}
              {r.car.name}
              {capacityText(r)}
            </option>
          ))}
        </optgroup>
      )}
      {otherRides.map(otherJob => {
        return (
          <optgroup label={otherJob.jobName} key={`optgr-${otherJob.jobId}`}>
            {otherJob.rides.map((r, index) => (
              <option key={r.id} value={r.id}>
                {jobNameToShort(otherJob.jobName) + ' '}
                {index + 1}
                {') '}
                {r.car.name}
                {capacityText(r)}
              </option>
            ))}
          </optgroup>
        )
      })}
    </select>
  )
}
