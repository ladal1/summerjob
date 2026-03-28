export interface AdorationSlotWithWorker {
  id: string
  date: string
  hour: number
  location: string
  worker: {
    id: string
    firstName: string
    lastName: string
    phone: string
  } | null
}

export interface FrontendAdorationSlot {
  id: string
  localDateStart: Date
  location: string
  capacity: number
  workerCount: number
  length: number
  isUserSignedUp?: boolean
  workers: {
    firstName: string
    lastName: string
    phone: string
  }[]
}

export interface AdorationSlotWithWorkerIds {
  id: string
  dateStart: Date
  location: string
  length: number
  capacity: number
  eventId: string
  workers: { id: string }[]
}

// API response types
export interface APIAdorationWorker {
  id: string
  firstName: string
  lastName: string
  phone: string
}

export interface APIAdorationSlotAdmin {
  id: string
  dateStart: string
  location: string
  capacity: number
  length: number
  workers: APIAdorationWorker[]
}

export interface APIAdorationSlotUser {
  id: string
  dateStart: string
  location: string
  capacity: number
  length: number
  workerCount: number
  isUserSignedUp: boolean
}
