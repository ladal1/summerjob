import { z } from 'zod'
import { CarSchema, RideSchema, WorkerSchema } from 'lib/prisma/zod'
import { ActiveJobWithProposed } from './active-job'
import useZodOpenApi from 'lib/api/useZodOpenApi'

useZodOpenApi

export const NO_RIDE = 'NO_RIDE'

export const RideWithDriverCarDetailsSchema = RideSchema.extend({
  driver: WorkerSchema,
  car: CarSchema,
})

type RideModel = z.infer<typeof RideSchema>
type WorkerModel = z.infer<typeof WorkerSchema>
type CarModel = z.infer<typeof CarSchema>

export type RideWithDriverCarDetails = z.infer<
  typeof RideWithDriverCarDetailsSchema
>

export type RideComplete = RideModel & {
  driver: WorkerModel
  car: CarModel
  job: ActiveJobWithProposed
  passengers: WorkerModel[]
}

export type RidesForJob = {
  jobId: string
  jobName: string
  rides: RideComplete[]
}

export const RideCreateSchema = z
  .object({
    driverId: z.string().uuid(),
    carId: z.string().uuid(),
    passengerIds: z.array(z.string().uuid()),
  })
  .strict()

export type RideCreateData = z.infer<typeof RideCreateSchema>

export const RideUpdateSchema = RideCreateSchema.omit({
  driverId: true,
  carId: true,
})
  .partial()
  .strict()

export type RideUpdateData = z.infer<typeof RideUpdateSchema>
