import { Area, Car, Worker } from '../../prisma/client'
import {
  DataSource,
  JobToBePlanned,
  ProposedJobNoActive,
  WorkerComplete,
} from '../datasources/DataSource'
import { Planner } from './Planner'

export class BasicPlanner implements Planner {
  datasource: DataSource

  constructor(datasource: DataSource) {
    this.datasource = datasource
  }

  /**
   * Start creating a plan. Fills workers into jobs, creates rides, sets responsible workers.
   * @param planId ID of the plan to start planning.
   * @returns Planned jobs.
   */
  async start(planId: string) {
    console.log('BasicPlanner: Starting plan %s', planId)
    const plan = await this.datasource.getPlan(planId)
    if (!plan) {
      console.log('BasicPlanner: Plan not found')
      return { success: false, jobs: [] }
    }
    const workersWithoutJob = await this.datasource.getWorkersWithoutJob(plan)
    // Shuffle workers to avoid assigning the first worker to the first job every day
    const shuffledWorkers = this.shuffleArray(workersWithoutJob)

    const categorizedWorkers = this.categorizeWorkers(shuffledWorkers)

    const jobsInPlan: PlannedJob[] = plan.jobs.map((job) => ({
      job: job.proposedJob,
      responsibleWorker: job.responsibleWorker || undefined,
      privateDescription: job.privateDescription || '',
      publicDescription: job.publicDescription || '',
      workers: job.workers,
      rides: job.rides.map((ride) => ({
        driver: ride.driver,
        car: ride.car,
        passengers: ride.passengers,
      })),
    }))

    jobsInPlan.sort((a, b) => {
      if (a.job.area.supportsAdoration && !b.job.area.supportsAdoration) {
        return -1
      }
      if (!a.job.area.supportsAdoration && b.job.area.supportsAdoration) {
        return 1
      }
      return 0
    })

    const minPlanned = this.planJobsRecursive(
      jobsInPlan.map((job) => ({ attemptsLeft: 1, plannedJob: job })),
      plan.day,
      categorizedWorkers
    )

    const filled1 = this.planFillJobs(
      minPlanned.plannedJobs,
      [
        ...minPlanned.remainingWorkers.others,
        ...minPlanned.remainingWorkers.strong,
      ],
      plan.day
    )

    const filledWithRides = this.addExtraDrivers(
      filled1.plannedJobs,
      this.categorizeWorkers([
        ...filled1.remainingWorkers,
        ...minPlanned.remainingWorkers.drivers,
      ]),
      plan.day
    )

    const filledPlan = this.planFillJobs(
      filledWithRides.plannedJobs,
      this.decategorizeWorkers(filledWithRides.remainingWorkers),
      plan.day
    )

    return {
      success: true,
      jobs: filledPlan.plannedJobs.map(this.plannedJobToDatabaseJob),
    }
  }

  /**
   * Adds extra drivers to jobs with the most free capacity. Does not add passengers.
   * @param plannedJobs Currently planned jobs to minimum workers.
   * @param workersWithoutJob Workers without job.
   * @returns Planned jobs with extra drivers.
   */
  addExtraDrivers(
    plannedJobs: PlannedJob[],
    workersWithoutJob: CategorizedWorkers,
    day: Date
  ): RecPlanningResult {
    if (workersWithoutJob.drivers.length === 0) {
      return { plannedJobs, remainingWorkers: workersWithoutJob }
    }
    const freeSlotsInJob = (job: PlannedJob) =>
      job.job.maxWorkers - job.workers.length
    plannedJobs.sort((a, b) => {
      return freeSlotsInJob(b) - freeSlotsInJob(a)
    })

    for (const job of plannedJobs) {
      if (workersWithoutJob.drivers.length === 0) {
        break
      }
      if (!job.job.area.requiresCar) {
        continue
      }
      // Don't add extra drivers if there is only one free slot left, they would have to drive alone
      if (freeSlotsInJob(job) <= 1) {
        break
      }
      const driverRequest = this.findDriver(
        workersWithoutJob,
        job.job.allergens,
        job.job.area.supportsAdoration,
        day
      )
      if (!driverRequest.worker) {
        continue
      }

      workersWithoutJob = driverRequest.remainingWorkers
      const newRide: RideWithPassengers = {
        driver: driverRequest.worker,
        car: driverRequest.worker.cars[0],
        passengers: [],
      }
      // If there are passengers on this job that are currently in a shared ride, add them to the new ride instead
      const allPassengersIds = job.rides
        .flatMap((ride) => [ride.driver, ...ride.passengers])
        .map((worker) => worker.id)
      const workersWithSharedRide = job.workers.filter(
        (worker) => !allPassengersIds.includes(worker.id)
      )
      if (workersWithSharedRide.length === 0) {
        // Everyone is already in a local ride, no need to change anything
        job.workers.push(driverRequest.worker)
        job.rides.push(newRide)
        continue
      }
      // Remove workers from shared ride and add them to this new ride instead
      for (const worker of workersWithSharedRide) {
        let rideFound = false
        for (const job of plannedJobs) {
          if (rideFound) {
            break
          }
          for (const ride of job.rides) {
            const index = ride.passengers.findIndex(
              (passenger) => passenger.id === worker.id
            )
            if (index >= 0) {
              ride.passengers.splice(index, 1)
              rideFound = true
              break
            }
          }
        }
        newRide.passengers.push(worker)
      }
      job.workers.push(driverRequest.worker)
      job.rides.push(newRide)
    }

    return { plannedJobs, remainingWorkers: workersWithoutJob }
  }

  /**
   * After basic planning, puts remaining workers into planned jobs if there are free seats in rides. Does not add workers to shared rides.
   * @param plannedJobs Planned jobs.
   * @param workersWithoutJob Workers without job.
   * @returns Result of planning.
   */
  planFillJobs(
    plannedJobs: PlannedJob[],
    workersWithoutJob: WorkerComplete[],
    day: Date
  ): FillPlanningResult {
    for (const plannedJob of plannedJobs) {
      if (workersWithoutJob.length === 0) {
        break
      }
      let workersNeeded = plannedJob.job.maxWorkers - plannedJob.workers.length
      if (plannedJob.rides.length === 0 && plannedJob.job.area.requiresCar) {
        continue
      }
      if (workersNeeded <= 0) {
        continue
      }
      // Fill workers into existing rides
      for (const ride of plannedJob.rides) {
        let seats = ride.car.seats - ride.passengers.length - 1
        if (seats <= 0) {
          continue
        }
        if (workersNeeded <= 0) {
          break
        }
        while (workersNeeded > 0 && seats > 0) {
          let availableWorker: WorkerComplete | undefined
          if (plannedJob.job.area.supportsAdoration) {
            availableWorker = workersWithoutJob.find(
              (w) =>
                !this.isAllergicTo(w, plannedJob.job.allergens) &&
                this.workerRequiresAdoration(w, day)
            )
          } else {
            availableWorker = workersWithoutJob.find(
              (w) =>
                !this.isAllergicTo(w, plannedJob.job.allergens) &&
                !this.workerRequiresAdoration(w, day)
            )
          }
          availableWorker ??= workersWithoutJob.find(
            (w) => !this.isAllergicTo(w, plannedJob.job.allergens)
          )
          // If every worker is allergic to this job, we can't fill it
          if (!availableWorker) {
            break
          }
          workersWithoutJob = workersWithoutJob.filter(
            (w) => w.id !== availableWorker!.id
          )
          ride.passengers.push(availableWorker)
          plannedJob.workers.push(availableWorker)
          workersNeeded--
          seats--
        }
      }

      if (!plannedJob.job.area.requiresCar) {
        while (workersNeeded > 0) {
          let availableWorker: WorkerComplete | undefined
          if (plannedJob.job.area.supportsAdoration) {
            availableWorker = workersWithoutJob.find(
              (w) =>
                !this.isAllergicTo(w, plannedJob.job.allergens) &&
                this.workerRequiresAdoration(w, day)
            )
          }
          availableWorker ??= workersWithoutJob.find(
            (w) => !this.isAllergicTo(w, plannedJob.job.allergens)
          )
          // If every worker is allergic to this job, we can't fill it
          if (!availableWorker) {
            break
          }
          workersWithoutJob = workersWithoutJob.filter(
            (w) => w.id !== availableWorker!.id
          )
          plannedJob.workers.push(availableWorker)
          workersNeeded--
        }
      }
    }

    return { plannedJobs, remainingWorkers: workersWithoutJob }
  }

  /**
   * Plans workers and rides to jobs with respect to strong workers and allergies. Planned jobs are only filled to minimal number of workers.
   * @param jobsToPlan List of jobs to plan, including existing workers and rides. `attemptsLeft` should be the same for all jobs.
   * @param workersWithoutJob All workers currently without a job.
   * @returns Planned jobs and remaining workers without job.
   */
  planJobsRecursive(
    jobsToPlan: JobPlanningAttempt[],
    day: Date,
    workersWithoutJob: CategorizedWorkers
  ): RecPlanningResult {
    if (jobsToPlan.length === 0) {
      return {
        plannedJobs: jobsToPlan.map((a) => a.plannedJob),
        remainingWorkers: workersWithoutJob,
      }
    }
    if (this.numWorkers(workersWithoutJob) === 0) {
      console.log('BasicPlanner: No more workers without job')
      return {
        plannedJobs: jobsToPlan.map((a) => a.plannedJob),
        remainingWorkers: workersWithoutJob,
      }
    }

    const { attemptsLeft, plannedJob } = jobsToPlan.shift()!

    if (attemptsLeft === 0) {
      console.log('BasicPlanner: No more attempts left')
      return {
        plannedJobs: [plannedJob, ...jobsToPlan.map((a) => a.plannedJob)],
        remainingWorkers: workersWithoutJob,
      }
    }

    // Remember the original state of workers in case we need to throw a worker away and replace them with a driver
    const workersAddedByPlanner = { strong: [], regular: [] } as {
      strong: WorkerComplete[];
      regular: WorkerComplete[];
    }

    // Fill in strong workers without job
    const assignedStrongWorkers = plannedJob.workers.filter((w) => w.isStrong)
    if (assignedStrongWorkers.length < plannedJob.job.strongWorkers) {
      const required = plannedJob.job.minWorkers - plannedJob.workers.length
      for (let i = 0; i < required; i++) {
        const findResult = this.findStrongWorker(
          workersWithoutJob,
          plannedJob.job.allergens,
          plannedJob.job.area.supportsAdoration,
          day
        )
        if (!findResult.worker) {
          break
        }
        plannedJob.workers.push(findResult.worker)
        workersAddedByPlanner.strong.push(findResult.worker)
        workersWithoutJob = findResult.remainingWorkers
      }
    }

    // Fill in other workers until the minimum is reached
    if (plannedJob.workers.length < plannedJob.job.minWorkers) {
      const required = plannedJob.job.minWorkers - plannedJob.workers.length
      for (let i = 0; i < required; i++) {
        const findResult = this.findWorker(
          workersWithoutJob,
          plannedJob.job.allergens,
          plannedJob.job.area.supportsAdoration,
          day
        )
        if (!findResult.worker) {
          break
        }
        plannedJob.workers.push(findResult.worker)
        workersAddedByPlanner.regular.push(findResult.worker)
        workersWithoutJob = findResult.remainingWorkers
      }
    }

    if (plannedJob.job.area.requiresCar) {
      // Check that everyone has transport
      let workersWithoutTransport = plannedJob.workers
      for (const ride of plannedJob.rides) {
        workersWithoutTransport = workersWithoutTransport.filter(
          (w) =>
            !(
              w.id === ride.driver.id ||
              ride.passengers.map((p) => p.id).includes(w.id)
            )
        )
      }
      if (workersWithoutTransport.length > 0) {
        // Not all workers have ride on this job, find if they already have ride from other jobs
        workersWithoutTransport = this.getWorkersNotInRides(
          workersWithoutTransport,
          jobsToPlan.map((j) => j.plannedJob.rides).flat()
        )
        if (workersWithoutTransport.length > 0) {
          // Plan rides for workers without transport
          // If there is already a car owner in job that doesn't have a drive planned, create a ride with them
          const drivers = workersWithoutTransport.filter(
            (w) => w.cars.length > 0
          )
          workersWithoutTransport = workersWithoutTransport.filter(
            (w) => !drivers.map((d) => d.id).includes(w.id)
          )
          for (const driver of drivers) {
            const car = driver.cars[0]
            plannedJob.rides.push({
              driver,
              car,
              passengers: workersWithoutTransport.slice(0, car.seats - 1),
            })
            workersWithoutTransport = workersWithoutTransport.slice(
              car.seats - 1
            )
          }

          if (workersWithoutTransport.length > 0) {
            // Plan rides for workers without transport
            // This can be done either by assigning them to a shared ride with another job (preferred)
            // or by finding a new driver for this job
            const sharedRidesInfo = this.findSharedRides(
              plannedJob.job.area,
              workersWithoutTransport.length,
              jobsToPlan.map((j) => j.plannedJob)
            )
            if (sharedRidesInfo.success) {
              // We can divide the workers into shared rides
              for (const sharedRideInfo of sharedRidesInfo.availableRides) {
                const sharedRide = sharedRideInfo.ride
                const seats =
                  sharedRide.car.seats - sharedRide.passengers.length - 1
                const passengers = workersWithoutTransport.slice(0, seats)
                workersWithoutTransport = workersWithoutTransport.slice(seats)
                const originalRide = jobsToPlan
                  .map((j) => j.plannedJob)
                  .find((j) => j.job.id === sharedRideInfo.proposedJobId)!
                  .rides.find((r) => r.driver.id === sharedRide.driver.id)!
                originalRide.passengers = [
                  ...originalRide.passengers,
                  ...passengers,
                ]
              }
              // Everything is planned, proceed to next job
              return this.planJobsRecursive(
                [
                  ...jobsToPlan,
                  { attemptsLeft: attemptsLeft - 1, plannedJob },
                ],
                day,
                workersWithoutJob
              )
            }
            // We can't find shared rides, find a new driver
            const findResult = this.findDriver(
              workersWithoutJob,
              plannedJob.job.allergens,
              plannedJob.job.area.supportsAdoration,
              day
            )
            if (!findResult.worker) {
              // No driver found, just shuffle the current state of the job and try again later
              return this.planJobsRecursive(
                [
                  ...jobsToPlan,
                  { attemptsLeft: attemptsLeft - 1, plannedJob },
                ],
                day,
                workersWithoutJob
              )
            }

            // Driver found, but it might be over max workers limit, so we need to throw away some workers
            if (plannedJob.workers.length + 1 > plannedJob.job.maxWorkers) {
              // Since ride assignments are done from the start of the worker array, and we know at least one worker is without a ride,
              // we can remove the last worker from the planned job if the planner added them - manually added workers are never removed
              if (workersAddedByPlanner.regular.length > 0) {
                plannedJob.workers.pop()
                const removedWorker = workersAddedByPlanner.regular.pop()!
                workersWithoutJob.others.push(removedWorker)
                workersWithoutTransport = workersWithoutTransport.filter(
                  (w) => w.id !== removedWorker.id
                )
              } else if (workersAddedByPlanner.strong.length > 0) {
                plannedJob.workers.pop()
                const removedWorker = workersAddedByPlanner.strong.pop()!
                workersWithoutJob.strong.push(removedWorker)
                workersWithoutTransport = workersWithoutTransport.filter(
                  (w) => w.id !== removedWorker.id
                )
              }
            }

            const driver = findResult.worker
            workersWithoutJob = findResult.remainingWorkers
            const car = driver.cars[0]
            plannedJob.rides.push({
              driver,
              car,
              passengers: workersWithoutTransport.slice(0, car.seats - 1),
            })
            workersWithoutTransport = workersWithoutTransport.slice(
              car.seats - 1
            )
            plannedJob.workers.push(driver)
          }
        } else {
          // All workers have rides, proceed to next job
          return this.planJobsRecursive(
            [
              ...jobsToPlan,
              { attemptsLeft: attemptsLeft - 1, plannedJob },
            ],
            day,
            workersWithoutJob
          )
        }
      }
    }

    return this.planJobsRecursive(
      [
        ...jobsToPlan,
        { attemptsLeft: attemptsLeft - 1, plannedJob },
      ],
      day,
      workersWithoutJob
    )
  }

  /**
   * Finds all workers that are not in any of the rides
   * @param workers Workers to look for
   * @param rides List of rides to search in
   * @returns Workers that are not in any of the rides
   */
  getWorkersNotInRides(
    workers: WorkerComplete[],
    rides: RideWithPassengers[]
  ): WorkerComplete[] {
    const workersInRides = rides
      .map((ride) => [ride.driver, ...ride.passengers])
      .flat()
      .map((w) => w.id)
    return workers.filter((w) => !workersInRides.includes(w.id))
  }

  /**
   * Finds up to two rides that can be used to transport the given number of passengers.
   * @param area Are of the job. Only rides to the same area are considered
   * @param passengersCount How many free seats are needed
   * @param plannedJobs Already planned jobs with rides
   * @returns If success is true, availableRides contains one or two rides that can be used to transport the passengers. If success is false, no rides were found.
   */
  findSharedRides(
    area: Area,
    passengersCount: number,
    plannedJobs: PlannedJob[]
  ): FindSharedRidesResult {
    const freeSeats = (ride: RideWithPassengers) => {
      return ride.car.seats - ride.passengers.length - 1
    }

    const jobsInArea = plannedJobs.filter((job) => job.job.areaId === area.id)
    const ridesByJob = jobsInArea
      .flatMap((job) =>
        job.rides.map<JobRide>((r) => ({ proposedJobId: job.job.id, ride: r }))
      )
      .filter((r) => freeSeats(r.ride) > 0)
    if (ridesByJob.length === 0) {
      return { success: false, availableRides: [] }
    }

    // Sort by free seats descending
    ridesByJob.sort((a, b) => freeSeats(b.ride) - freeSeats(a.ride))
    if (freeSeats(ridesByJob[0].ride) >= passengersCount) {
      // We can fit passengers in one ride, find the ride where free seats == passengers_count or a bit higher
      // If all rides have free seats > passengers_count, we will use the ride with the least free seats (last one)
      for (let i = 1; i < ridesByJob.length; i++) {
        const r = ridesByJob[i]
        if (freeSeats(r.ride) < passengersCount) {
          return { success: true, availableRides: [ridesByJob[i - 1]] }
        }
      }
      return { success: true, availableRides: [ridesByJob.slice(-1)[0]] }
    }

    // We can't fit passengers in one ride, find two rides where free seats 1 + free seats 2 >= passengers_count
    // Start from the lowest free seats (end of array) and go up to ensure we use the rides with the least free seats
    // This could be further optimized to find any two rides that fit the passengers_count
    for (let i = ridesByJob.length - 2; i > 0; i--) {
      const r1 = ridesByJob[i + 1]
      const r2 = ridesByJob[i]
      if (freeSeats(r1.ride) + freeSeats(r2.ride) >= passengersCount) {
        return { success: true, availableRides: [r1, r2] }
      }
    }

    return { success: false, availableRides: [] }
  }

  /**
   * Helper function to print planned job
   * @param job Jobs to print
   */
  logPlannedJob(job: PlannedJob) {
    console.log('------' + job.job.name + ' [', job.job.area.name, '] ------')
    console.log(
      'Workers:',
      job.workers.map((w) => w.firstName + ' ' + w.lastName).join(', ')
    )
    if (!job.job.area.requiresCar) {
      console.log('No car needed')
    }
    console.log('Rides:')
    for (const ride of job.rides) {
      console.log(
        '  ' + ride.driver.firstName + ' ' + ride.driver.lastName,
        '-',
        ride.passengers.map((p) => p.firstName + ' ' + p.lastName).join(', '),
        '- Free seats:',
        ride.car.seats - ride.passengers.length - 1
      )
    }
  }

  /**
   * Checks whether the given worker wants to do adoration on the given day
   * @param worker Worker to check
   * @param day Day to check
   * @returns True if worker requires adoration on the given day, false otherwise
   */
  workerRequiresAdoration(worker: WorkerComplete, day: Date): boolean {
    return worker.availability.adorationDays
      .map((d) => d.getTime())
      .includes(day.getTime())
  }

  /**
   * Finds a driver that can be used for the job.
   * @param workers List of available workers.
   * @param jobAllergens Allergens present on the job. If a driver is allergic to any of these, he cannot be used.
   * @param areaSupportsAdoration Whether the area supports adoration. If true, a driver that requires adoration will be used if possible.
   * @param day Day of the job. Used to check whether a driver requires adoration.
   * @returns Driver that can be used for the job and the remaining unused workers. If no driver is found, null is returned.
   */
  findDriver(
    workers: CategorizedWorkers,
    jobAllergens: string[],
    areaSupportsAdoration: boolean,
    day: Date
  ): FindWorkerResult {
    let driver: WorkerComplete | undefined
    if (areaSupportsAdoration) {
      driver = workers.drivers.find(
        (w) =>
          !this.isAllergicTo(w, jobAllergens) &&
          this.workerRequiresAdoration(w, day)
      )
    } else {
      driver ??= workers.drivers.find(
        (w) =>
          !this.isAllergicTo(w, jobAllergens) &&
          !this.workerRequiresAdoration(w, day)
      )
    }
    driver ??= workers.drivers.find((w) => !this.isAllergicTo(w, jobAllergens))
    if (!driver) {
      return { worker: null, remainingWorkers: workers }
    }
    return {
      worker: driver,
      remainingWorkers: {
        others: workers.others,
        strong: workers.strong,
        drivers: workers.drivers.filter((w) => w.id !== driver!.id),
      },
    }
  }

  /**
   * Finds a strong worker that can be used for the job.
   * @param workers List of available workers.
   * @param jobAllergens Allergens present on the job. If a strong worker is allergic to any of these, he cannot be used.
   * @param areaSupportsAdoration Whether the area supports adoration. If true, a strong worker that requires adoration will be used if possible.
   * @param day Day of the job. Used to check whether a strong worker requires adoration.
   * @returns Strong worker that can be used for the job and the remaining unused workers. If no strong worker is found, null is returned.
   */
  findStrongWorker(
    workers: CategorizedWorkers,
    jobAllergens: string[],
    areaSupportsAdoration: boolean,
    day: Date
  ): FindWorkerResult {
    let worker: WorkerComplete | undefined
    if (areaSupportsAdoration) {
      worker = workers.strong.find(
        (w) =>
          !this.isAllergicTo(w, jobAllergens) &&
          this.workerRequiresAdoration(w, day)
      )
    } else {
      worker ??= workers.strong.find(
        (w) =>
          !this.isAllergicTo(w, jobAllergens) &&
          !this.workerRequiresAdoration(w, day)
      )
    }
    worker ??= workers.strong.find((w) => !this.isAllergicTo(w, jobAllergens))
    if (!worker) {
      return { worker: null, remainingWorkers: workers }
    }
    return {
      worker,
      remainingWorkers: {
        others: workers.others,
        strong: workers.strong.filter((w) => w.id !== worker!.id),
        drivers: workers.drivers,
      },
    }
  }

  /**
   * Finds a worker that can be used for the job. Regular workers are considered first, then strong workers, then drivers.
   * @param workers List of available workers.
   * @param jobAllergens Allergens present on the job. If a worker is allergic to any of these, he cannot be used.
   * @param areaSupportsAdoration Whether the area supports adoration. If true, a worker that requires adoration will be used if possible.
   * @param day Day of the job. Used to check whether a worker requires adoration.
   * @returns A suitable worker that can be used for the job and the remaining unused workers. If no worker is found, null is returned.
   */
  findWorker(
    workers: CategorizedWorkers,
    jobAllergens: string[],
    areaSupportsAdoration: boolean,
    day: Date
  ): FindWorkerResult {
    let worker: WorkerComplete | undefined
    if (areaSupportsAdoration) {
      worker = workers.others.find(
        (w) =>
          !this.isAllergicTo(w, jobAllergens) &&
          this.workerRequiresAdoration(w, day)
      )
    } else {
      worker ??= workers.others.find(
        (w) =>
          !this.isAllergicTo(w, jobAllergens) &&
          !this.workerRequiresAdoration(w, day)
      )
    }
    worker ??= workers.others.find((w) => !this.isAllergicTo(w, jobAllergens))
    if (worker) {
      return {
        worker,
        remainingWorkers: {
          others: workers.others.filter((w) => w.id !== worker!.id),
          strong: workers.strong,
          drivers: workers.drivers,
        },
      }
    }

    const findStrong = this.findStrongWorker(
      workers,
      jobAllergens,
      areaSupportsAdoration,
      day
    )
    if (findStrong.worker) {
      return findStrong
    }
    const findDriver = this.findDriver(
      workers,
      jobAllergens,
      areaSupportsAdoration,
      day
    )
    if (findDriver.worker) {
      return findDriver
    }
    return { worker: null, remainingWorkers: workers }
  }

  /**
   * Checks whether a worker is allergic to any of the allergens.
   * @param worker Worker to check.
   * @param allergens Allergens to check.
   * @returns True if the worker is allergic to any of the allergens, false otherwise.
   */
  isAllergicTo(worker: WorkerComplete, allergens: string[]): boolean {
    return worker.allergies.some((id) => allergens.includes(id))
  }

  /**
   * Splits the workers into three categories: drivers, strong workers, and regular workers.
   * @param workers Workers to categorize.
   * @returns Workers in three categories: drivers, strong workers, and regular workers.
   */
  categorizeWorkers(workers: WorkerComplete[]): CategorizedWorkers {
    return workers.reduce(
      (acc: CategorizedWorkers, worker: WorkerComplete) => {
        if (worker.cars.length > 0) {
          return {
            drivers: [...acc.drivers, worker],
            strong: acc.strong,
            others: acc.others,
          }
        }
        if (worker.isStrong && worker.cars.length === 0) {
          return {
            drivers: acc.drivers,
            strong: [...acc.strong, worker],
            others: acc.others,
          }
        }
        return {
          drivers: acc.drivers,
          strong: acc.strong,
          others: [...acc.others, worker],
        }
      },
      { drivers: [], strong: [], others: [] }
    )
  }

  /**
   * Decategorizes the workers into one array.
   * @param workers Categorized workers.
   * @returns All workers in one array.
   */
  decategorizeWorkers(workers: CategorizedWorkers): WorkerComplete[] {
    return [...workers.drivers, ...workers.strong, ...workers.others]
  }

  /**
   * Gets the total number of workers in all categories combined.
   * @param workers Categorized workers.
   * @returns Total number of workers.
   */
  numWorkers(workers: CategorizedWorkers): number {
    return (
      workers.drivers.length + workers.strong.length + workers.others.length
    )
  }

  /**
   * Converts between two different types of PlannedJob objects. This is a helper function for this planner.
   * @param plannedJob A PlannedJob object.
   * @returns A JobToBePlanned object.
   */
  plannedJobToDatabaseJob(plannedJob: PlannedJob): JobToBePlanned {
    const responsibleWorker =
      plannedJob.responsibleWorker || plannedJob.workers[0] || undefined
    return {
      proposedJobId: plannedJob.job.id,
      workerIds: plannedJob.workers.map((w) => w.id),
      responsibleWorkerId: responsibleWorker ? responsibleWorker.id : undefined,
      privateDescription:
        plannedJob.privateDescription || plannedJob.job.privateDescription,
      publicDescription:
        plannedJob.publicDescription || plannedJob.job.publicDescription,
      rides: plannedJob.rides.map((r) => ({
        driverId: r.driver.id,
        carId: r.car.id,
        passengerIds: r.passengers.map((p) => p.id),
      })),
    }
  }

  /**
   * Shuffles an array reasonably well. Taken from https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
   * @param array Array to shuffle.
   * @returns Shuffled array.
   */
  shuffleArray<T>(array: T[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]
    }
    return array
  }
}

interface FindWorkerResult {
  worker: WorkerComplete | null;
  remainingWorkers: CategorizedWorkers;
}

interface FindSharedRidesResult {
  success: boolean;
  availableRides: JobRide[];
}

interface JobRide {
  proposedJobId: string;
  ride: RideWithPassengers;
}

interface CategorizedWorkers {
  drivers: WorkerComplete[];
  strong: WorkerComplete[];
  others: WorkerComplete[];
}

interface PlannedJob {
  job: ProposedJobNoActive;
  workers: WorkerComplete[];
  responsibleWorker?: Worker;
  rides: RideWithPassengers[];
  privateDescription?: string;
  publicDescription?: string;
}

interface RideWithPassengers {
  driver: Worker;
  car: Car;
  passengers: Worker[];
}

interface RecPlanningResult {
  plannedJobs: PlannedJob[];
  remainingWorkers: CategorizedWorkers;
}

interface FillPlanningResult {
  plannedJobs: PlannedJob[];
  remainingWorkers: WorkerComplete[];
}

interface JobPlanningAttempt {
  attemptsLeft: number;
  plannedJob: PlannedJob;
}
