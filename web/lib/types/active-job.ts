import { ActiveJob, Plan } from 'lib/prisma/client'
import { ProposedJobWithArea } from './proposed-job'
import type { Worker } from 'lib/prisma/client'
import { z } from 'zod'
import { WorkerComplete } from './worker'
import { Serialized } from './serialize'
import { ActiveJobSchema, ProposedJobSchema } from 'lib/prisma/zod'
import { ActiveJobNoPlanSchema } from './_schemas'
import { RideComplete } from './ride'

export type ActiveJobNoPlan = z.infer<typeof ActiveJobNoPlanSchema>

export type ActiveJobComplete = ActiveJob & {
  workers: WorkerComplete[]
  proposedJob: ProposedJobWithArea
  rides: RideComplete[]
  responsibleWorker: Worker | null
  plan: Plan
}

export const ActiveJobWithProposedSchema = ActiveJobSchema.extend({
  proposedJob: ProposedJobSchema,
})

export type ActiveJobWithProposed = z.infer<typeof ActiveJobWithProposedSchema>

export const ActiveJobCreateSchema = z
  .object({
    proposedJobId: z.string().min(1),
    privateDescription: z.string(),
    publicDescription: z.string(),
    planId: z.string(),
  })
  .strict()

export type ActiveJobCreateData = z.infer<typeof ActiveJobCreateSchema>

export const ActiveJobUpdateSchema = z
  .object({
    privateDescription: z.string(),
    publicDescription: z.string(),
    workerIds: z.array(z.string()),
    responsibleWorkerId: z.string(),
    rideIds: z.array(z.string()),
  })
  .partial()
  .strict()

export type ActiveJobUpdateData = z.infer<typeof ActiveJobUpdateSchema>

export const ActiveJobCreateMultipleSchema = z
  .object({
    jobs: z.array(ActiveJobCreateSchema.omit({ planId: true })),
    planId: z.string(),
  })
  .strict()

export type ActiveJobCreateMultipleData = z.infer<
  typeof ActiveJobCreateMultipleSchema
>

export function serializeActiveJob(
  job: ActiveJobComplete
): Serialized<ActiveJobComplete> {
  return {
    data: JSON.stringify(job),
  }
}

export function deserializeActiveJob(job: Serialized<ActiveJobComplete>) {
  const parsed = JSON.parse(job.data) as ActiveJobComplete
  parsed.plan.day = new Date(parsed.plan.day)
  return parsed
}
