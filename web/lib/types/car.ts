import { z } from 'zod'
import { Serialized } from './serialize'
import { CarSchema, RideSchema, WorkerSchema } from 'lib/prisma/zod'
import useZodOpenApi from 'lib/api/useZodOpenApi'
import { customErrorMessages as err } from 'lib/lang/error-messages'

useZodOpenApi

export const CarCompleteSchema = CarSchema.extend({
  owner: WorkerSchema,
  rides: z.array(RideSchema),
})

export type CarComplete = z.infer<typeof CarCompleteSchema>

export function serializeCars(cars: CarComplete[]): Serialized {
  return {
    data: JSON.stringify(cars),
  }
}

export function deserializeCars(cars: Serialized): CarComplete[] {
  return JSON.parse(cars.data)
}

export const CarCreateSchema = z
  .object({
    ownerId: z.string({ required_error: err.emptyOwnerOfCar }),
    name: z.string().min(1, { message: err.emptyCarName }),
    description: z.string(),
    seats: z
      .number({ invalid_type_error: err.invalidTypeNumber })
      .min(1, { message: err.emptyCarSeats })
      .positive({ message: err.nonPositiveNumber })
      .openapi({ example: 4 }),
    odometerStart: z
      .number({
        invalid_type_error: err.invalidTypeNumber,
        required_error: err.emptyOdometerStart,
      })
      .nonnegative({ message: err.nonNonNegativeNumber })
      .default(0),
    odometerEnd: z
      .number({ invalid_type_error: err.invalidTypeNumber })
      .nonnegative({ message: err.nonNonNegativeNumber })
      .default(0)
      .optional(),
    reimbursed: z.boolean().optional().openapi({ example: false }),
    reimbursementAmount: z
      .number({ invalid_type_error: err.invalidTypeNumber })
      .nonnegative({ message: err.nonNonNegativeNumber })
      .default(0)
      .optional(),
  })
  .strict()

export type CarCreateData = z.infer<typeof CarCreateSchema>

export const CarUpdateSchema = CarCreateSchema.omit({
  ownerId: true,
}).partial()

export type CarUpdateData = z.infer<typeof CarUpdateSchema>
