import { MyPlan, MyRide } from 'lib/types/my-plan'
import { PlanComplete } from 'lib/types/plan'
import { RideComplete } from 'lib/types/ride'
import {
  NoActiveEventError,
  WorkerNotRegisteredInEventError,
} from './internal-error'
import { getCompletePlans } from './plans'
import { getActiveSummerJobEvent } from './summerjob-event'

export function getMyPlan(plan: PlanComplete, workerId: string): MyPlan {
  // Find if worker has a job on this day
  const myJob = plan.jobs.find(job =>
    job.workers.map(worker => worker.id).includes(workerId)
  )
  if (!myJob) {
    return {
      day: plan.day,
    }
  }
  // Find if worker has a ride
  const isInRide = (ride: RideComplete) =>
    ride.driver.id === workerId ||
    ride.passengers.map(passenger => passenger.id).includes(workerId)

  const rideInfo = (ride: RideComplete): MyRide => ({
    car: ride.car.name,
    isDriver: ride.driver.id === workerId,
    driverName: `${ride.driver.firstName} ${ride.driver.lastName}`,
    driverPhone: ride.driver.phone,
    endsAtMyJob: ride.job.id === myJob.id,
    endJobName: ride.job.proposedJob.name,
  })

  let myRide: MyRide | null = null
  for (const ride of myJob.rides) {
    if (isInRide(ride)) {
      myRide = rideInfo(ride)
      break
    }
  }
  // If worker has no ride on this job, look if they share a ride with another job
  if (!myRide) {
    for (const ride of plan.jobs.flatMap(job => job.rides)) {
      if (isInRide(ride)) {
        myRide = rideInfo(ride)
        break
      }
    }
  }
  const responsibleWorkerName = myJob.responsibleWorker
    ? `${myJob.responsibleWorker.firstName} ${myJob.responsibleWorker.lastName}`
    : 'Není'
  return {
    day: plan.day,
    job: {
      name: myJob.proposedJob.name,
      description: myJob.publicDescription,
      responsibleWorkerName: responsibleWorkerName,
      workerNames: myJob.workers.map(
        worker => `${worker.firstName} ${worker.lastName}`
      ),
      contact: myJob.proposedJob.contact,
      allergens: myJob.proposedJob.allergens,
      location: {
        name: myJob.proposedJob.area.name,
        address: myJob.proposedJob.address,
      },
      hasFood: myJob.proposedJob.hasFood,
      hasShower: myJob.proposedJob.hasShower,
      ...(myRide && { ride: myRide }),
    },
  }
}

export async function getMyPlans(workerId: string): Promise<MyPlan[]> {
  const activeEvent = await getActiveSummerJobEvent()
  if (!activeEvent) {
    throw new NoActiveEventError()
  }
  if (
    !activeEvent.workerAvailability
      .map(avail => avail.workerId)
      .includes(workerId)
  ) {
    throw new WorkerNotRegisteredInEventError()
  }

  const plans = await getCompletePlans()
  return plans.map(plan => getMyPlan(plan, workerId))
}
