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
  }[]
}