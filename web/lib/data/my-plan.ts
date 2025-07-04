import { MyPlan, MyRide } from 'lib/types/my-plan'
import { PlanComplete, sortJobsByAreaAndId } from 'lib/types/plan'
import { RideComplete } from 'lib/types/ride'
import {
  NoActiveEventError,
  WorkerNotRegisteredInEventError,
} from './internal-error'
import { getCompletePlans } from './plans'
import { getActiveSummerJobEvent } from './summerjob-event'
import { getWorkerAdorationSlotsForDay } from './adoration'
import prisma from 'lib/prisma/connection'

// Helper function to get all adoration slots for a day
async function getAllAdorationSlotsForDay(date: Date) {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)

  const end = new Date(date)
  end.setHours(23, 59, 59, 999)

  return prisma.adorationSlot.findMany({
    where: {
      dateStart: {
        gte: start,
        lte: end,
      },
    },
    include: {
      workers: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
    },
    orderBy: { dateStart: 'asc' },
  })
}

export async function getMyPlan(
  plan: PlanComplete,
  workerId: string
): Promise<MyPlan> {
  // Find if worker has a job on this day
  const myJob = plan.jobs.find(job =>
    job.workers.map(worker => worker.id).includes(workerId)
  )

  // Get adoration slots for this worker on this day
  const adorationSlots = await getWorkerAdorationSlotsForDay(workerId, plan.day)

  // Get all adoration slots for this day to find adjacent ones
  const allAdorationSlots = await getAllAdorationSlotsForDay(plan.day)

  const adorations = adorationSlots.map(slot => {
    const endTime = new Date(slot.dateStart)
    endTime.setMinutes(endTime.getMinutes() + slot.length)

    const sameTimeWorkers = slot.workers.filter(w => w.id !== workerId)

    // Find previous workers (slots that end within 15 minutes before this slot starts)
    const previousWorkers: Array<{
      firstName: string
      lastName: string
      phone: string
    }> = []
    const slotStartTime = new Date(slot.dateStart).getTime()

    allAdorationSlots.forEach(otherSlot => {
      if (otherSlot.id === slot.id) return // Skip the same slot

      const otherEndTime = new Date(otherSlot.dateStart)
      otherEndTime.setMinutes(otherEndTime.getMinutes() + otherSlot.length)
      const timeDiff = slotStartTime - otherEndTime.getTime()

      // If other slot ends within 15 minutes before this slot starts
      if (timeDiff >= 0 && timeDiff <= 15 * 60 * 1000) {
        otherSlot.workers.forEach(w => {
          if (
            w.id !== workerId &&
            !previousWorkers.some(
              pw => pw.firstName === w.firstName && pw.lastName === w.lastName
            )
          ) {
            previousWorkers.push({
              firstName: w.firstName,
              lastName: w.lastName,
              phone: w.phone,
            })
          }
        })
      }
    })

    // Find next workers (slots that start within 15 minutes after this slot ends)
    const nextWorkers: Array<{
      firstName: string
      lastName: string
      phone: string
    }> = []
    const slotEndTime = endTime.getTime()

    allAdorationSlots.forEach(otherSlot => {
      if (otherSlot.id === slot.id) return // Skip the same slot

      const otherStartTime = new Date(otherSlot.dateStart).getTime()
      const timeDiff = otherStartTime - slotEndTime

      // If other slot starts within 15 minutes after this slot ends
      if (timeDiff >= 0 && timeDiff <= 15 * 60 * 1000) {
        otherSlot.workers.forEach(w => {
          if (
            w.id !== workerId &&
            !nextWorkers.some(
              nw => nw.firstName === w.firstName && nw.lastName === w.lastName
            )
          ) {
            nextWorkers.push({
              firstName: w.firstName,
              lastName: w.lastName,
              phone: w.phone,
            })
          }
        })
      }
    })

    return {
      startTime: slot.dateStart,
      endTime: endTime,
      location: slot.location,
      previousWorkers: previousWorkers.length > 0 ? previousWorkers : undefined,
      nextWorkers: nextWorkers.length > 0 ? nextWorkers : undefined,
      sameTimeWorkers: sameTimeWorkers.map(w => ({
        firstName: w.firstName,
        lastName: w.lastName,
        phone: w.phone,
      })),
    }
  })

  if (!myJob || !plan.published) {
    return {
      day: plan.day,
      adorations: adorations.length > 0 ? adorations : undefined,
    }
  }
  // Find sequence number of job
  const sortedJobs = sortJobsByAreaAndId(plan.jobs)
  let seqNum: string | undefined = undefined
  const index = sortedJobs.findIndex(job => job.id === myJob.id)
  if (index !== -1) {
    seqNum = (index + 1).toString()
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
      // log job id and ride id (and endsAtMyJob)
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
      seqNum: seqNum,
      name: myJob.proposedJob.name,
      description: myJob.proposedJob.publicDescription,
      responsibleWorkerName: responsibleWorkerName,
      workerNames: myJob.workers.map(
        worker => `${worker.firstName} ${worker.lastName} (${worker.phone})`
      ),
      contact: myJob.proposedJob.contact,
      allergens: myJob.proposedJob.allergens,
      location: {
        name: myJob.proposedJob.area?.name ?? 'Zatím neznáma',
        address: myJob.proposedJob.address,
        coordinates:
          myJob.proposedJob.coordinates &&
          myJob.proposedJob.coordinates.at(0) &&
          myJob.proposedJob.coordinates.at(1)
            ? [
                myJob.proposedJob.coordinates.at(0) as number,
                myJob.proposedJob.coordinates.at(1) as number,
              ]
            : null,
      },
      hasFood: myJob.proposedJob.hasFood,
      hasShower: myJob.proposedJob.hasShower,
      ...(myRide && { ride: myRide }),
    },
    adorations: adorations.length > 0 ? adorations : undefined,
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

  // Create a map of existing plans by date
  const plansByDate = new Map<string, PlanComplete>()
  plans.forEach(plan => {
    const dateKey = plan.day.toISOString().split('T')[0]
    plansByDate.set(dateKey, plan)
  })

  // Generate MyPlan objects for all days in the event
  const myPlans: MyPlan[] = []
  const startDate = new Date(activeEvent.startDate)
  const endDate = new Date(activeEvent.endDate)

  for (
    let date = new Date(startDate);
    date <= endDate;
    date.setDate(date.getDate() + 1)
  ) {
    const dateKey = date.toISOString().split('T')[0]
    const existingPlan = plansByDate.get(dateKey)

    if (existingPlan) {
      // Use existing plan
      const myPlan = await getMyPlan(existingPlan, workerId)
      myPlans.push(myPlan)
    } else {
      // Create a minimal plan for this day to fetch adorations
      const adorationSlots = await getWorkerAdorationSlotsForDay(
        workerId,
        new Date(date)
      )
      const allAdorationSlots = await getAllAdorationSlotsForDay(new Date(date))

      const adorations = adorationSlots.map(slot => {
        const endTime = new Date(slot.dateStart)
        endTime.setMinutes(endTime.getMinutes() + slot.length)

        const sameTimeWorkers = slot.workers.filter(w => w.id !== workerId)

        // Find previous workers (slots that end within 15 minutes before this slot starts)
        const previousWorkers: Array<{
          firstName: string
          lastName: string
          phone: string
        }> = []
        const slotStartTime = new Date(slot.dateStart).getTime()

        allAdorationSlots.forEach(otherSlot => {
          if (otherSlot.id === slot.id) return // Skip the same slot

          const otherEndTime = new Date(otherSlot.dateStart)
          otherEndTime.setMinutes(otherEndTime.getMinutes() + otherSlot.length)
          const timeDiff = slotStartTime - otherEndTime.getTime()

          // If other slot ends within 15 minutes before this slot starts
          if (timeDiff >= 0 && timeDiff <= 15 * 60 * 1000) {
            otherSlot.workers.forEach(w => {
              if (
                w.id !== workerId &&
                !previousWorkers.some(
                  pw =>
                    pw.firstName === w.firstName && pw.lastName === w.lastName
                )
              ) {
                previousWorkers.push({
                  firstName: w.firstName,
                  lastName: w.lastName,
                  phone: w.phone,
                })
              }
            })
          }
        })

        // Find next workers (slots that start within 15 minutes after this slot ends)
        const nextWorkers: Array<{
          firstName: string
          lastName: string
          phone: string
        }> = []
        const slotEndTime = endTime.getTime()

        allAdorationSlots.forEach(otherSlot => {
          if (otherSlot.id === slot.id) return // Skip the same slot

          const otherStartTime = new Date(otherSlot.dateStart).getTime()
          const timeDiff = otherStartTime - slotEndTime

          // If other slot starts within 15 minutes after this slot ends
          if (timeDiff >= 0 && timeDiff <= 15 * 60 * 1000) {
            otherSlot.workers.forEach(w => {
              if (
                w.id !== workerId &&
                !nextWorkers.some(
                  nw =>
                    nw.firstName === w.firstName && nw.lastName === w.lastName
                )
              ) {
                nextWorkers.push({
                  firstName: w.firstName,
                  lastName: w.lastName,
                  phone: w.phone,
                })
              }
            })
          }
        })

        return {
          startTime: slot.dateStart,
          endTime: endTime,
          location: slot.location,
          previousWorkers:
            previousWorkers.length > 0 ? previousWorkers : undefined,
          nextWorkers: nextWorkers.length > 0 ? nextWorkers : undefined,
          sameTimeWorkers: sameTimeWorkers.map(w => ({
            firstName: w.firstName,
            lastName: w.lastName,
            phone: w.phone,
          })),
        }
      })

      myPlans.push({
        day: new Date(date),
        adorations: adorations.length > 0 ? adorations : undefined,
      })
    }
  }

  return myPlans
}
