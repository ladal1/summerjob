import { RideCreateData, RideUpdateData } from 'lib/types/ride'
import prisma from 'lib/prisma/connection'
import { PrismaTransactionClient } from 'lib/types/prisma'

export async function createRide(data: RideCreateData, jobId: string) {
  const { passengerIds, ...rideData } = data
  // Delete any rides that have the driver as their driver
  const ride = await prisma.$transaction(async tx => {
    const ride = await prisma.ride.create({
      data: {
        ...rideData,
        jobId,
        passengers: {
          connect: passengerIds.map(id => ({ id })),
        },
      },
    })
    await removeWorkersFromRides(tx, [...passengerIds, data.driverId], ride.id)
  })
  return ride
}

export async function updateRide(id: string, data: RideUpdateData) {
  const { passengerIds, ...rideData } = data
  let passengersCommand = {}
  if (passengerIds) {
    passengersCommand = {
      passengers: {
        set: passengerIds.map(id => ({ id })),
      },
    }
  }
  const ride = await prisma.$transaction(async tx => {
    // If we're updating the passengers, we need to check that other rides don't have them as passengers
    if (passengerIds) {
      await removeWorkersFromRides(tx, passengerIds, id)
    }
    // Now all other rides are safe, we can connect the passengers to this ride
    const res = await tx.ride.update({
      where: {
        id,
      },
      data: {
        ...rideData,
        ...passengersCommand,
      },
    })
    return res
  })

  return ride
}

async function removeWorkersFromRides(
  tx: PrismaTransactionClient,
  workerIds: string[],
  keepInRideId: string
) {
  // Find all other rides in the same day as the job of this ride
  const currentRide = await tx.ride.findUniqueOrThrow({
    where: { id: keepInRideId },
    select: {
      job: {
        select: { plan: { select: { jobs: { select: { rides: true } } } } },
      },
    },
  })
  const otherRidesIds = currentRide.job.plan.jobs
    .flatMap(j => j.rides)
    .map(r => r.id)
    .filter(i => i !== keepInRideId)
  const otherRides = await tx.ride.findMany({
    where: {
      id: {
        in: otherRidesIds,
      },
    },
    select: {
      id: true,
      passengers: true,
      driverId: true,
    },
  })
  // Check that none of the other rides have any of the to-be-passengers as passengers
  // If they do, disconnect them
  for (const otherRide of otherRides) {
    const passengersToDisconnect = otherRide.passengers.filter(p =>
      workerIds.includes(p.id)
    )
    if (passengersToDisconnect.length > 0) {
      await tx.ride.update({
        where: {
          id: otherRide.id,
        },
        data: {
          passengers: {
            disconnect: passengersToDisconnect.map(p => ({ id: p.id })),
          },
        },
      })
    }
  }
  // Check that none of the other rides have any of the to-be-passengers as driver
  // If they do, delete the ride
  for (const otherRide of otherRides) {
    if (workerIds.includes(otherRide.driverId)) {
      await tx.ride.delete({
        where: {
          id: otherRide.id,
        },
      })
    }
  }
}

export async function deleteRide(id: string) {
  await prisma.ride.delete({
    where: {
      id,
    },
  })
}
