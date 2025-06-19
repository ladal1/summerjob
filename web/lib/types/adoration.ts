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
