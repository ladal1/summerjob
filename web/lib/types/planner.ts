import useZodOpenApi from 'lib/api/useZodOpenApi'
import { z } from 'zod'

useZodOpenApi

export const PlannerSubmitSchema = z.object({
  planId: z.string().openapi({
    type: 'string',
    format: 'uuid',
    description: 'The ID of the plan to submit for planning',
  }),
})

export type PlannerSubmitData = z.infer<typeof PlannerSubmitSchema>
