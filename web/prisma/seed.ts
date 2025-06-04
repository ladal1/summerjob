import {
  FoodAllergy,
  WorkAllergy,
  SkillHas,
  SkillBrings,
  Car,
  Plan,
  PostTag,
  PrismaClient,
  ProposedJob,
  SummerJobEvent,
  Worker,
} from '../lib/prisma/client'
import { faker } from '@faker-js/faker/locale/cz'
import { Prisma } from '../lib/prisma/client'

const prisma = new PrismaClient()

function choose<T>(array: T[], amount: number): T[] {
  return array
    .map(x => ({ x, r: Math.random() }))
    .sort((a, b) => a.r - b.r)
    .map(a => a.x)
    .slice(0, amount)
}

function between(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

function startWithZeros(num: number, numOfDigits = 2) {
  const numString = num.toString()
  const numZerosToAdd = numOfDigits - numString.length
  return '0'.repeat(numZerosToAdd) + numString
}

function chooseWithProbability<T>(array: T[], probability: number): T[] {
  return array.filter((_, i) => Math.random() < probability)
}

async function createWorkers(eventId: string, days: Date[], count = 100) {
  const HAS_CAR_PERCENTAGE = 0.25
  const WORKERS_COUNT = count

  const createWorker = () => {
    const sex = Math.random() > 0.5 ? 'male' : 'female'
    const firstName = faker.name.firstName(sex)
    const lastName = faker.name.lastName(sex)
    const workDays = choose(days, between(4, days.length))

    return Prisma.validator<Prisma.WorkerCreateInput>()({
      firstName,
      lastName,
      phone: faker.phone.number('### ### ###'),
      email: faker.internet.email(firstName, lastName).toLocaleLowerCase(),
      isStrong: Math.random() > 0.75,
      ownsCar: false,
      foodAllergies: { set: choose(Object.values(FoodAllergy), between(0, 2)) },
      workAllergies: { set: choose(Object.values(WorkAllergy), between(0, 2)) },
      skills: { set: choose(Object.values(SkillHas), between(1, 3)) },
      tools: { set: choose(Object.values(SkillBrings), between(1, 2)) },
      availability: {
        create: {
          eventId,
          workDays,
          adorationDays: chooseWithProbability(workDays, 0.15),
        },
      },
      permissions: {
        create: {
          permissions: [],
        },
      },
    })
  }

  const withCar = (worker: Prisma.WorkerCreateInput) => {
    const odometerValue = between(10000, 100000)
    return {
      ...worker,
      ownsCar: true,
      cars: {
        create: [
          {
            name: faker.vehicle.vehicle() + ', ' + faker.vehicle.vrm(),
            description: faker.color.human(),
            seats: between(4, 5),
            odometerStart: odometerValue,
            odometerEnd: odometerValue + between(100, 1000),
            forEventId: eventId,
          },
        ],
      },
    }
  }

  const numWorkersWithCar = Math.floor(WORKERS_COUNT * HAS_CAR_PERCENTAGE)

  for (let i = 0; i < WORKERS_COUNT - numWorkersWithCar; i++) {
    const worker = createWorker()
    if (i === 0 || Math.random() < 0.15) {
      worker.isStrong = true
    }
    await prisma.worker.create({ data: worker })
  }

  for (let i = 0; i < numWorkersWithCar; i++) {
    const worker = withCar(createWorker())
    await prisma.worker.create({ data: worker })
  }

  return await prisma.worker.findMany()
}

async function createYearlyEvent() {
  const eventLastYear = await prisma.summerJobEvent.findFirst({
    orderBy: {
      startDate: 'desc',
    },
  })
  const year = eventLastYear
    ? eventLastYear.endDate.getFullYear() + 1
    : new Date().getFullYear() + 1
  const month = startWithZeros(between(1, 12))
  const dayStart = between(1, 25)
  const dayEnd = between(dayStart, 28)
  const event = await prisma.summerJobEvent.create({
    data: {
      name: `${faker.address.cityName()} ${year}`,
      startDate: new Date(`${year}-${month}-${startWithZeros(dayStart)}`),
      endDate: new Date(`${year}-${month}-${startWithZeros(dayEnd)}`),
      isActive: true,
    },
  })
  return event
}

async function createAreas(eventId: string, count = 7) {
  const AREAS_COUNT = count
  const createArea = (areaId: number) => {
    return {
      name: faker.address.city(),
      summerJobEventId: eventId,
      requiresCar: Math.random() < 0.8,
      supportsAdoration: areaId === 0,
    }
  }
  await prisma.area.createMany({
    data: [...Array(AREAS_COUNT)].map((_, index) => createArea(index)),
  })
  return await prisma.area.findMany()
}

async function createProposedJobs(
  areaIds: string[],
  eventId: string,
  days: Date[],
  workAllergies: WorkAllergy[],
  count = 70
) {
  let titles = [
    'Hrabání listí',
    'Přesouvání kamení',
    'Řezání dřeva',
    'Úprava zahrady',
    'Vymalování místnosti',
  ]
  for (let i = 0; i < count - 5; i++) {
    titles.push('Práce: ' + faker.commerce.productName())
  }
  titles = titles.slice(0, count)

  const createProposedJob = (name: string) => {
    return {
      name: name,
      publicDescription: faker.lorem.paragraph(),
      privateDescription: faker.lorem.paragraph(),
      areaId: choose(areaIds, 1)[0],
      requiredDays: between(1, 3),
      minWorkers: between(2, 3),
      maxWorkers: between(4, 6),
      strongWorkers: between(0, 1),
      address: faker.address.streetAddress(),
      contact: faker.name.fullName() + ', ' + faker.phone.number('### ### ###'),
      hasFood: Math.random() > 0.5,
      hasShower: Math.random() > 0.7,
    }
  }

  for (const title of titles) {
    await prisma.proposedJob.create({
      data: {
        ...createProposedJob(title),
        availability: chooseWithProbability(days, 0.5),
        allergens: {
          set: choose(workAllergies, between(0, 2)),
        },
      },
    })
  }

  return await prisma.proposedJob.findMany()
}

async function createPlan(event: SummerJobEvent) {
  const plan = await prisma.plan.create({
    data: {
      day: event.startDate,
      summerJobEventId: event.id,
    },
  })
  return plan
}

async function populatePlan(
  plan: Plan,
  proposedJobs: ProposedJob[],
  workers: Worker[]
) {
  const job = choose(proposedJobs, 1)[0]
  const workersCount = between(job.minWorkers, job.maxWorkers)
  const workersIds = choose(workers, workersCount).map(worker => worker.id)
  // Have strong worker if required
  if (job.strongWorkers > 0) {
    const strongWorker = workers.find(w => w.isStrong) || workers[0]
    if (!workersIds.includes(strongWorker.id)) {
      workersIds[0] = strongWorker.id
    }
  }
  // Have driver
  type WorkerWithCar = Worker & { cars: Car[] }
  const drivers = (await prisma.worker.findMany({
    where: {
      cars: {
        some: {},
      },
    },
    include: {
      cars: true,
    },
  })) as WorkerWithCar[]
  const assignedWorkersWithCar = drivers.filter(driver =>
    workersIds.includes(driver.id)
  )
  let driver: WorkerWithCar
  if (assignedWorkersWithCar.length === 0) {
    driver = drivers[0]
    workersIds[1] = driver.id
  } else {
    driver = assignedWorkersWithCar[0]
  }

  const activeJob = await prisma.activeJob.create({
    data: {
      planId: plan.id,
      proposedJobId: job.id,
      workers: {
        connect: workersIds.map(id => ({ id })),
      },
      responsibleWorkerId: driver.id,
    },
  })

  const ride = await prisma.ride.create({
    data: {
      driverId: driver.id,
      carId: driver.cars[0].id,
      passengers: {
        connect: workersIds.filter(id => id !== driver.id).map(id => ({ id })),
      },
      jobId: activeJob.id,
    },
  })
}

async function createPosts(eventId: string, days: Date[], count = 10) {
  const POSTS_COUNT = count
  const createPost = () => {
    const printTime = Math.random() > 0.5
    const hourStart = faker.datatype.number({ min: 0, max: 21 })
    const hourEnd = faker.datatype.number({ min: hourStart, max: 23 })
    const tags = choose(Object.values(PostTag), between(1, 3))
    return {
      forEventId: eventId,
      name: faker.lorem.words(3),
      madeIn: choose(days, 1)[0],
      availability: chooseWithProbability(days, 0.5),
      timeFrom: printTime
        ? `${startWithZeros(hourStart)}:${startWithZeros(between(0, 59))}`
        : undefined,
      timeTo: printTime
        ? `${startWithZeros(hourEnd)}:${startWithZeros(between(0, 59))}`
        : undefined,
      address: faker.address.streetAddress(),
      coordinates: [+faker.address.longitude(), +faker.address.latitude()],
      tags: tags,
      shortDescription: faker.lorem.sentence(),
      longDescription: faker.lorem.paragraph(),
      isOpenForParticipants: Math.random() > 0.5,
      isMandatory: Math.random() > 0.7,
      isPinned: Math.random() > 0.8,
    }
  }

  for (let i = 0; i < POSTS_COUNT; i++) {
    await prisma.post.create({
      data: createPost(),
    })
  }

  return await prisma.post.findMany()
}

async function setEventAsInactive() {
  await prisma.summerJobEvent.updateMany({
    data: {
      isActive: false,
    },
  })
}

async function main() {
  console.log('Seting potential active event as inactive...')
  await setEventAsInactive()
  const mini = process.argv[2] === 'mini'
  console.log('Creating yearly event...')
  const yearlyEvent = await createYearlyEvent()
  const workAllergies = Object.values(WorkAllergy)
  console.log('Creating workers, cars...')
  const workers = await createWorkers(
    yearlyEvent.id,
    datesBetween(yearlyEvent.startDate, yearlyEvent.endDate),
    mini ? 5 : 100
  )
  console.log('Creating areas...')
  const areas = await createAreas(yearlyEvent.id, mini ? 2 : 10)
  console.log('Creating proposed jobs...')
  const proposedJobs = await createProposedJobs(
    areas.map(area => area.id),
    yearlyEvent.id,
    datesBetween(yearlyEvent.startDate, yearlyEvent.endDate),
    workAllergies,
    mini ? 5 : 70
  )
  console.log('Creating plan...')
  const plan = await createPlan(yearlyEvent)
  console.log('Populating plan...')
  if (!mini) {
    await populatePlan(plan, proposedJobs, workers)
  }
  console.log('Creating posts...')
  await createPosts(
    yearlyEvent.id,
    datesBetween(yearlyEvent.startDate, yearlyEvent.endDate),
    mini ? 5 : 30
  )
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async e => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

function datesBetween(start: Date, end: Date) {
  const dates: Date[] = []
  for (
    let date = new Date(start);
    date <= end;
    date.setDate(date.getDate() + 1)
  ) {
    dates.push(new Date(date))
  }
  return dates
}
