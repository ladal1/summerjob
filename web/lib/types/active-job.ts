import { ActiveJobSchema, PlanSchema, ProposedJobSchema } from 'lib/prisma/zod'
import { z } from 'zod'
import { ActiveJobNoPlanSchema } from './_schemas'
import {
  ProposedJobForActiveJobSchema,
  ProposedJobWithArea,
} from './proposed-job'
import { RideComplete } from './ride'
import { Serialized } from './serialize'
import { WorkerComplete } from './worker'

export type ActiveJobNoPlan = z.infer<typeof ActiveJobNoPlanSchema>

type ActiveJobModel = z.infer<typeof ActiveJobSchema>
type PlanModel = z.infer<typeof PlanSchema>

export type ActiveJobComplete = ActiveJobModel & {
  workers: WorkerComplete[]
  proposedJob: ProposedJobWithArea
  rides: RideComplete[]
  responsibleWorker: WorkerComplete | null
  plan: PlanModel
}

export type ActiveJobWorkersAndJobs = ActiveJobModel & {
  workers: WorkerComplete[]
  proposedJob: ProposedJobWithArea
  plan: PlanModel
}

export const ActiveJobWithProposedSchema = ActiveJobSchema.extend({
  proposedJob: ProposedJobSchema,
})

export type ActiveJobWithProposed = z.infer<typeof ActiveJobWithProposedSchema>

export const ActiveJobCreateSchema = z
  .object({
    proposedJobId: z.string().min(1),
    planId: z.string(),
  })
  .strict()

export type ActiveJobCreateData = z.infer<typeof ActiveJobCreateSchema>

export const ActiveJobUpdateSchema = z
  .object({
    completed: z.boolean(),
    proposedJob: ProposedJobForActiveJobSchema.strict().partial(),
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

export function serializeActiveJob(job: ActiveJobComplete): Serialized {
  return {
    data: JSON.stringify(job),
  }
}

export function deserializeActiveJob(job: Serialized) {
  const parsed = JSON.parse(job.data) as ActiveJobComplete
  parsed.plan.day = new Date(parsed.plan.day)
  return parsed
}
