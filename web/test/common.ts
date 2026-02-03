import { randomBytes } from 'crypto'
import { PrismaClient } from '../lib/prisma/client'
import request from 'supertest'
import { fakerCS_CZ } from '@faker-js/faker'
import path from 'path'
import fs, { promises } from 'fs'

const prisma = new PrismaClient()
const faker = fakerCS_CZ

/**
 * Creates a session for the given user
 * @param email Email of the user to create a session for
 * @returns Session cookie
 */
async function getSessionCookie(email: string) {
  let user = await prisma.user.findFirst({
    where: {
      email,
    },
  })
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        emailVerified: new Date(),
      },
    })
  }
  const token = randomBytes(32).toString('hex')
  const DAYS_TO_EXPIRE = 1
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * DAYS_TO_EXPIRE)
  await prisma.session.create({
    data: {
      sessionToken: token,
      expires: expires,
      userId: user.id,
    },
  })

  return `next-auth.session-token=${token}`
}

/**
 * Creates a user with admin permissions and an empty event.
 * @returns Email of the created user
 */
async function initDB() {
  const start = new Date()
  start.setUTCFullYear(start.getUTCFullYear() + 1)
  start.setUTCMonth(10)
  start.setUTCDate(10)
  start.setUTCHours(0)
  start.setUTCMinutes(0)
  start.setUTCSeconds(0)
  start.setUTCMilliseconds(0)
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 7)
  const event = await prisma.summerJobEvent.create({
    data: {
      name: 'Test Event',
      startDate: start,
      endDate: end,
      isActive: true,
    },
  })

  const admin = await prisma.worker.create({
    data: {
      firstName: 'Admin',
      lastName: 'Account',
      email: 'admin@localhost.cz',
      phone: '1234567890',
      permissions: {
        create: {
          permissions: ['ADMIN'],
        },
      },
      availability: {
        create: {
          eventId: event.id,
          workDays: [start],
        },
      },
    },
  })

  return { event, admin }
}

async function wipeDB() {
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter(name => name !== '_prisma_migrations')
    .map(name => `"public"."${name}"`)
    .join(', ')

  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`)
  } catch (error) {
    console.log({ error })
  }
}

async function changePermissions(email: string, permission: string) {
  await prisma.worker.update({
    where: {
      email,
    },
    data: {
      permissions: {
        update: {
          permissions: [permission],
        },
      },
    },
  })
}

//#region Common
class Common {
  private _adminId: string
  private _email: string
  private _session: string
  private _event: { id: string; start: Date; end: Date }
  private _url = 'http://localhost:3000'

  private _lastIdentity: string = Id.ADMIN

  private getSession = async () => {
    if (this._session) return this._session
    this._session = await getSessionCookie(this._email)
    return this._session
  }

  private setup = async () => {
    await wipeDB()
    const { event, admin } = await initDB()
    this._adminId = admin.id
    this._email = admin.email
    this._event = { id: event.id, start: event.startDate, end: event.endDate }
    this._session = await this.getSession()
  }

  getSummerJobEventId = () => this._event.id

  getSummerJobEventStart = () => this._event.start

  getSummerJobEventEnd = () => this._event.end

  //#region Files managment
  getUploadDirForImagesForCurrentEvent = () => {
    const activeEventId = this.getSummerJobEventId()
    return this.getUploadDirForImages() + '/' + activeEventId
  }

  private getUploadDirForImages = (): string => {
    return path.resolve(`../${process.env.UPLOAD_DIR || '/web-storage'}`)
  }

  private deleteFile = async (oldPhotoPath: string) => {
    await promises.unlink(oldPhotoPath)
  }

  private deleteDirectory = async (dir: string) => {
    try {
      await promises.rm(dir, { recursive: true, force: true })
    } catch (err) {
      console.error(err)
    }
  }

  pathExists = (path: string) => {
    return fs.existsSync(path)
  }

  numberOfFilesInsideDirectory = async (dir: string) => {
    try {
      const files = await fs.promises.readdir(dir)
      return files.length
    } catch (error) {
      console.error('Error reading directory:', error)
      return -1
    }
  }

  getAbsolutePath = (relativePath: string) => {
    return path.join(this.getUploadDirForImagesForCurrentEvent(), relativePath)
  }

  deleteWorkersPhoto = async (workerId: string) => {
    const resp = await this.get(`/api/workers/${workerId}`, Id.WORKERS)
    const relativePath = resp.body.photoPath
    const absolutePath = path.join(
      this.getUploadDirForImagesForCurrentEvent(),
      relativePath
    )
    this.deleteFile(absolutePath)
  }
  //#endregion

  //region Basic API usage
  deletePlan = async (planId: string) => {
    await this.del(`/api/plans/${planId}`, Id.ADMIN)
  }

  createWorker = async () => {
    const worker = await this.post(
      '/api/workers/new',
      Id.WORKERS,
      createWorkerData()
    )
    return worker.body
  }

  deleteWorker = async (workerId: string) => {
    await this.del(`/api/workers/${workerId}`, Id.WORKERS)
  }

  createCar = async (driverId: string) => {
    const car = await this.post('/api/cars', Id.CARS, createCarData(driverId))
    return car.body
  }

  deleteCar = async (carId: string) => {
    await this.del(`/api/cars/${carId}`, Id.CARS)
  }

  createArea = async () => {
    const area = await this.post(
      `/api/summerjob-events/${this.getSummerJobEventId()}/areas`,
      Id.ADMIN,
      createAreaData()
    )
    return area.body
  }

  deleteArea = async (areaId: string) => {
    await this.del(
      `/api/summerjob-events/${this.getSummerJobEventId()}/areas/${areaId}`,
      Id.ADMIN
    )
  }

  createProposedJob = async (areaId: string) => {
    const job = await this.post(
      `/api/proposed-jobs`,
      Id.ADMIN,
      createProposedJobData(areaId)
    )
    return job.body
  }

  deleteProposedJob = async (jobId: string) => {
    await this.del(`/api/proposed-jobs/${jobId}`, Id.ADMIN)
  }
  // #endregion

  // #region Complicated API usage
  createProposedJobWithPhotos = async (filePaths: string[]) => {
    const area = await api.createArea()
    const body = createProposedJobData(area.id)
    return await api.post('/api/proposed-jobs', Id.JOBS, body, filePaths)
  }

  createPlanWithJob = async () => {
    const plan = await api.post(
      '/api/plans',
      Id.PLANS,
      createPlanData(api.getSummerJobEventEnd())
    )
    const area = await api.createArea()
    const job = await api.createProposedJob(area.id)
    const payload = {
      proposedJobId: job.id,
      planId: plan.body.id,
    }
    const activeJob = await api.post(
      `/api/plans/${plan.body.id}/active-jobs`,
      Id.PLANS,
      payload
    )
    return { plan: plan.body, area: area, job: activeJob.body }
  }

  /**
   * Creates a plan with two jobs with two workers each, one of which has a ride.
   * @returns Created plan, area, job with ride (first) and job without ride, each with two workers.
   */
  createPlanWithJobsAndRide = async () => {
    // Add two workers to a job, plan a ride for them
    const { plan, area, job } = await this.createPlanWithJob()
    const driver = await this.createWorker()
    const passenger = await this.createWorker()
    await this.post(`/api/plans/${plan.id}/active-jobs/${job.id}`, Id.PLANS, {
      workerIds: [driver.id, passenger.id],
    })
    const car = await this.createCar(driver.id)
    const payload = {
      carId: car.id,
      driverId: driver.id,
      passengerIds: [passenger.id],
    }
    const ride = await this.post(
      `/api/plans/${plan.id}/active-jobs/${job.id}/rides`,
      Id.PLANS,
      payload
    )
    // Set driver as a responsible worker for the job
    await this.post(`/api/plans/${plan.id}/active-jobs/${job.id}`, Id.PLANS, {
      responsibleWorkerId: [driver.id],
    })

    // Add another job to the plan with two different workers
    const otherJob = await this.createProposedJob(area.id)
    await this.post(`/api/plans/${plan.id}/active-jobs`, Id.PLANS, {
      proposedJobId: otherJob.id,
      privateDescription: faker.lorem.paragraph(),
      publicDescription: '',
    })
    const workers = await Promise.all([
      this.createWorker(),
      this.createWorker(),
    ])
    await this.post(
      `/api/plans/${plan.id}/active-jobs/${otherJob.id}`,
      Id.PLANS,
      {
        workerIds: workers.map(w => w.id),
      }
    )
    await this.post(
      `/api/plans/${plan.id}/active-jobs/${otherJob.id}`,
      Id.PLANS,
      {
        responsibleWorkerId: [workers[0].id],
      }
    )

    return {
      plan,
      area,
      jobs: [
        { id: job.id, ride: ride.body, workerIds: [driver.id, passenger.id] },
        { id: otherJob.id, workerIds: workers.map(w => w.id) },
      ],
    }
  }
  //#endregion

  //#region API methods
  get = async (url: string, identity: string) => {
    if (!this._session) await this.setup()
    if (identity !== this._lastIdentity) {
      await changePermissions(this._email, identity)
      this._lastIdentity = identity
    }
    return request(this._url)
      .get(url)
      .set('Cookie', [this._session])
      .set('Accept', 'application/json')
      .send()
  }

  post = async (
    url: string,
    identity: string,
    body: Record<string, unknown>,
    files: string[] = []
  ) => {
    if (!this._session) await this.setup()
    if (identity !== this._lastIdentity) {
      await changePermissions(this._email, identity)
      this._lastIdentity = identity
    }
    const requestPromise = request(this._url)
      .post(url)
      .set('Cookie', [this._session])
      .field('jsonData', JSON.stringify(body))
    for (let i = 0; i < files.length; i++) {
      requestPromise.attach(`file${i}`, files[i])
    }
    return requestPromise
  }

  patch = async (
    url: string,
    identity: string,
    body: Record<string, unknown>,
    files: string[] = []
  ) => {
    if (!this._session) await this.setup()
    if (identity !== this._lastIdentity) {
      await changePermissions(this._email, identity)
      this._lastIdentity = identity
    }
    const requestPromise = request(this._url)
      .patch(url)
      .set('Cookie', [this._session])
      .field('jsonData', JSON.stringify(body))
    for (let i = 0; i < files.length; i++) {
      requestPromise.attach(`file${i}`, files[i])
    }
    return requestPromise
  }

  del = async (url: string, identity: string) => {
    if (!this._session) await this.setup()
    if (identity !== this._lastIdentity) {
      await changePermissions(this._email, identity)
      this._lastIdentity = identity
    }
    return request(this._url)
      .delete(url)
      .set('Cookie', [this._session])
      .set('Accept', 'application/json')
      .send()
  }
  //#endregion

  //#region Setup
  beforeTestBlock = async () => {
    await this.setup()
  }

  afterTestBlock = async () => {
    // Set the active event
    await this.patch(
      `/api/summerjob-events/${this.getSummerJobEventId()}`,
      Id.ADMIN,
      {
        isActive: true,
      }
    )
    // Delete all workers except the admin
    const workers = await this.get('/api/workers', Id.WORKERS)
    for (const worker of workers.body) {
      if (worker.id === this._adminId) continue
      await api.deleteWorker(worker.id)
    }
    // Delete all cars
    const cars = await this.get('/api/cars', Id.CARS)
    for (const car of cars.body) {
      await api.deleteCar(car.id)
    }
    // Delete all areas - this also deletes all proposed and active jobs
    const areas = await this.get(
      `/api/summerjob-events/${this.getSummerJobEventId()}/areas`,
      Id.ADMIN
    )
    for (const area of areas.body) {
      await api.del(
        `/api/summerjob-events/${this.getSummerJobEventId()}/areas/${area.id}`,
        Id.ADMIN
      )
    }
    // Delete all photos
    this.deleteDirectory(this.getUploadDirForImagesForCurrentEvent())
  }
  //#endregion
}

//#region Generate data
export function createWorkerData() {
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    age: faker.number.int({ min: 10, max: 99 }),
    email: faker.internet.email(),
    phone: faker.phone.number({ style: 'national' }),
    team: Math.random() > 0.5,
    strong: Math.random() > 0.5,
    allergyIds: [],
    skills: [],
    availability: {
      workDays: [],
    },
  }
}

export function createCarData(ownerId: string) {
  const odometerStart = Math.floor(Math.random() * 5000)
  const odometerEnd = Math.floor(Math.random() * 1000 + odometerStart)
  return {
    ownerId,
    name: faker.vehicle.vehicle(),
    description: faker.vehicle.color(),
    seats: Math.floor(Math.random() * 3 + 2),
    odometerStart,
    odometerEnd,
    reimbursed: false,
    reimbursementAmount: 1000,
  }
}

export function createAreaData() {
  return {
    name: faker.location.city(),
    requiresCar: true,
    supportsAdoration: true,
  }
}

export function createProposedJobData(areaId: string) {
  return {
    areaId: areaId,
    allergens: ['HAY'],
    privateDescription: 'string',
    publicDescription: 'string',
    name: 'string',
    address: 'string',
    contact: 'string',
    maxWorkers: 1,
    minWorkers: 1,
    strongWorkers: 0,
    requiredDays: 1,
    hasFood: true,
    hasShower: true,
    availability: ['2023-04-24T00:00:00.000Z'],
    jobType: 'OTHER',
    coordinates: [0, 0],
    priority: 1,
  }
}

export function createPostData() {
  return {
    name: 'name',
    availability: ['2023-04-24T00:00:00.000Z'],
    timeFrom: '12:00',
    timeTo: '13:00',
    address: faker.location.streetAddress(),
    coordinates: [],
    shortDescription: 'string',
    longDescription: 'string',
    tags: ['EATING'],
    isMandatory: false,
    isOpenForParticipants: false,
  }
}

export function createSummerJobEventData() {
  return {
    name: 'Test Summer Job Event',
    startDate: '2023-06-05T00:00:00.000Z',
    endDate: '2023-06-11T00:00:00.000Z',
  }
}

export function createPlanData(date: Date) {
  return {
    day: date.toISOString(),
  }
}

export const Id = {
  ADMIN: 'ADMIN',
  JOBS: 'JOBS',
  WORKERS: 'WORKERS',
  CARS: 'CARS',
  PLANS: 'PLANS',
  POSTS: 'POSTS',
}

export const Tools = {
  AXE: 'AXE',
  BOW_SAW: 'BOW_SAW',
  LADDER: 'LADDER',
  PAINT: 'PAINT',
  PAINT_ROLLER: 'PAINT_ROLLER',
}
//#endregion

//#region Helpers
export const isEmpty = (value: unknown) => {
  if (Array.isArray(value) || typeof value === 'string')
    return value.length === 0
  if (value === null || value === undefined) return true
  if (typeof value === 'object')
    return Object.keys(value as Record<string, unknown>).length === 0
  return false
}

export const getFileNameAndType = (photoPath: string) => {
  const fileType = path.extname(photoPath)
  const fileName = path.basename(photoPath, fileType)
  /*
  const lastSlashIndex = photoPath.lastIndexOf('/')
  const lastDotIndex = photoPath.lastIndexOf('.')
  // there should be some / and . in name of photoPath
  lastSlashIndex.should.not.equal(-1)
  lastDotIndex.should.not.equal(-1)
  // newly created photo should be named as {id}.{type}
  const fileName = photoPath.slice(lastSlashIndex + 1, lastDotIndex)
  const fileType = photoPath.slice(lastDotIndex)*/
  return { fileName, fileType }
}
//#endregion

export const api = new Common()
