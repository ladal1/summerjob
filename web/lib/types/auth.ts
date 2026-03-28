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
  APPLICATIONS = 'APPLICATIONS',
  ADORATION = 'ADORATION',
  RECEPTION = 'RECEPTION',
  NOTIFICATIONS = 'NOTIFICATIONS',
}

export type ExtendedSession = Session & {
  userID: string
  username: string
  permissions: Permission[]
}
