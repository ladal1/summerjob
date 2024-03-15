import useZodOpenApi from 'lib/api/useZodOpenApi'
import { PlanSchema, SummerJobEventSchema } from 'lib/prisma/zod'
import { z } from 'zod'
import { AreaCompleteSchema } from './area'
import { deserializePlanDate } from './plan'
import { Serialized } from './serialize'

useZodOpenApi

export const SummerJobEventCompleteSchema = SummerJobEventSchema.extend({
  areas: z.array(AreaCompleteSchema),
  plans: z.array(PlanSchema),
})

export type SummerJobEventComplete = z.infer<
  typeof SummerJobEventCompleteSchema
>

export const SummerJobEventCreateSchema = z
  .object({
    name: z.string().min(1),
    startDate: z
      .date()
      .or(z.string().min(1).pipe(z.coerce.date()))
      .openapi({ type: 'string', format: 'date' }),
    endDate: z
      .date()
      .or(z.string().min(1).pipe(z.coerce.date()))
      .openapi({ type: 'string', format: 'date' }),
  })
  .strict()
  .refine(
    data => data.startDate <= data.endDate,
    data => ({
      message: 'Konečné datum musí být po datu zahájení',
      path: ['endDate'],
    })
  )

export type SummerJobEventCreateDataInput = z.input<
  typeof SummerJobEventCreateSchema
>

export type SummerJobEventCreateData = z.infer<
  typeof SummerJobEventCreateSchema
>

export const SummerJobEventUpdateSchema = z
  .object({
    isActive: z.boolean(),
  })
  .strict()

export type SummerJobEventUpdateDataInput = z.input<
  typeof SummerJobEventUpdateSchema
>

export type SummerJobEventUpdateData = z.infer<
  typeof SummerJobEventUpdateSchema
>

export function serializeSummerJobEvent(
  event: SummerJobEventComplete
): Serialized {
  return {
    data: JSON.stringify(event),
  }
}

export function deserializeSummerJobEvent(
  event: Serialized
): SummerJobEventComplete {
  const dEvent = JSON.parse(event.data) as SummerJobEventComplete
  dEvent.startDate = new Date(dEvent.startDate)
  dEvent.endDate = new Date(dEvent.endDate)
  return dEvent
}

export function serializeSummerJobEvents(
  events: SummerJobEventComplete[]
): Serialized {
  return {
    data: JSON.stringify(events),
  }
}

export function deserializeSummerJobEvents(
  event: Serialized
): SummerJobEventComplete[] {
  const dEvents = JSON.parse(event.data) as SummerJobEventComplete[]
  for (const dEvent of dEvents) {
    dEvent.startDate = new Date(dEvent.startDate)
    dEvent.endDate = new Date(dEvent.endDate)
    dEvent.plans = dEvent.plans.map(deserializePlanDate)
  }
  return dEvents
}
