import { z } from 'zod'
import { Serialized } from './serialize'
import { Area, AreaSchema, ProposedJobSchema } from 'lib/prisma/zod'

export const AreaCreateSchema = z
  .object({
    name: z.string().min(1),
    requiresCar: z.boolean(),
    supportsAdoration: z.boolean(),
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
