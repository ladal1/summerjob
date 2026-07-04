import { Serialized } from './serialize'

export type ArrivalWorker = {
  id: string
  firstName: string
  lastName: string
  phone: string
  email: string
  age: number | null
  arrived: boolean
  show: boolean
  birthDate: string | null
  cars: { id: string; name: string }[]
}

export function serializeArrivals(data: ArrivalWorker[]): Serialized {
  return {
    data: JSON.stringify(data),
  }
}

export function deserializeArrivals(data: Serialized): ArrivalWorker[] {
  return JSON.parse(data.data) as ArrivalWorker[]
}
