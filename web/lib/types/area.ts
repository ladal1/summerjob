import { z } from 'zod'
import { Serialized } from './serialize'
import {
  Area,
  AreaSchema,
  ProposedJobSchema,
  WorkerSchema,
} from 'lib/prisma/zod'
import { customErrorMessages as err } from 'lib/lang/error-messages'

// Accepts a UUID, an empty string (from a "none" select option), or null.
// Empty string is normalized to null so the manager can be cleared.
const nullableUuid = z
  .string()
  .nullable()
  .transform(v => (v === '' || v === null ? null : v))
  .pipe(z.string().uuid().nullable())

export const AreaCreateSchema = z
  .object({
    name: z.string().min(1, { message: err.emptyAreaName }),
    requiresCar: z.boolean(),
    supportsAdoration: z.boolean(),
    managerId: nullableUuid,
    summerJobEventId: z.string().min(1),
  })
  .strict()

export type AreaCreateData = z.infer<typeof AreaCreateSchema>

export const AreaUpdateSchema = AreaCreateSchema.omit({
  summerJobEventId: true,
})
  .strict()
  .partial()

export type AreaUpdateData = z.infer<typeof AreaUpdateSchema>

export const AreaCompleteSchema = AreaSchema.extend({
  jobs: z.array(ProposedJobSchema),
  manager: WorkerSchema.nullable(),
})

export type AreaComplete = z.infer<typeof AreaCompleteSchema>

export function serializeAreaComp(area: AreaComplete): Serialized {
  return {
    data: JSON.stringify(area),
  }
}

export function deserializeAreaComp(data: Serialized): AreaComplete {
  return JSON.parse(data.data)
}

export function serializeAreas(areas: Area[]): Serialized {
  return {
    data: JSON.stringify(areas),
  }
}

export function deserializeAreas(data: Serialized): Area[] {
  return JSON.parse(data.data)
}
