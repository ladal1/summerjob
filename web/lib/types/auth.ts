import { Session } from 'next-auth'

export type UserSession = {
  workerId: string
  name: string
}

export enum Permission {
  ADMIN = 'ADMIN',
  PLANS = 'PLANS',
  JOBS = 'JOBS',
  CARS = 'CARS',
  WORKERS = 'WORKERS',
  POSTS = 'POSTS',
}

export type ExtendedSession = Session & {
  userID: string
  username: string
  permissions: Permission[]
}
