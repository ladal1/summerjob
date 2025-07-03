import useZodOpenApi from 'lib/api/useZodOpenApi'
import { ActiveJob, Plan } from 'lib/prisma/client'
import { ActiveJobSchema, PlanSchema } from 'lib/prisma/zod'
import { z } from 'zod'
import { ActiveJobNoPlanSchema } from './_schemas'
import { Serialized } from './serialize'
import { deserializeWorkerAvailability } from './worker'
import { ActiveJobNoPlan } from './active-job'

useZodOpenApi

export const PlanCreateSchema = z.object({
  day: z.date().or(z.string().min(1).pipe(z.coerce.date())).openapi({
    type: 'string',
    format: 'date',
  }),
})

export type PlanCreateDataInput = z.input<typeof PlanCreateSchema>
export type PlanCreateData = z.infer<typeof PlanCreateSchema>

export const PlanCompleteSchema = PlanSchema.extend({
  jobs: z.array(ActiveJobNoPlanSchema),
})

export type PlanComplete = z.infer<typeof PlanCompleteSchema>

export const PlanWithJobsSchema = PlanSchema.extend({
  jobs: z.array(ActiveJobSchema),
})

export type PlanUpdateDataInput = z.input<typeof PlanUpdateSchema>
export const PlanUpdateSchema = z.object({
  published: z.boolean(),
})

export type PlanWithJobs = Plan & {
  jobs: ActiveJob[]
}

export const PlanUpdateMoveWorkerSchema = z.object({
  workerId: z.string(),
  fromJobId: z.string(),
  toJobId: z.string(),
  fromRideId: z.string().optional(),
  toRideId: z.string().optional(),
})

export type PlanUpdateMoveWorker = z.infer<typeof PlanUpdateMoveWorkerSchema>

export function serializePlan(plan: PlanComplete): Serialized {
  return {
    data: JSON.stringify(plan),
  }
}

export function deserializePlan(plan: Serialized) {
  let parsed = JSON.parse(plan.data) as PlanComplete
  parsed = deserializePlanDate(parsed)
  for (let i = 0; i < parsed.jobs.length; i++) {
    parsed.jobs[i].workers = parsed.jobs[i].workers.map(
      deserializeWorkerAvailability
    )
  }
  return parsed as PlanComplete
}

export function serializePlans(plans: PlanWithJobs[]): Serialized {
  return {
    data: JSON.stringify(plans),
  }
}

export function deserializePlans(data: Serialized): PlanWithJobs[] {
  let parsed = JSON.parse(data.data)
  parsed = parsed.map(deserializePlanDate)
  return parsed
}

export function deserializePlanDate<T extends Plan>(data: T) {
  data.day = new Date(data.day)
  return data
}

/**
 * Sorts jobs by area name (null areas are treated as "Nezadaná oblast") and then by job ID.
 * Also reassigns sequential IDs starting from 1.
 * @param jobs Array of jobs to sort
 * @returns Sorted array of jobs with reassigned sequential IDs
 */
export function sortJobsByAreaAndId(
  jobs: ActiveJobNoPlan[]
): ActiveJobNoPlan[] {
  const sortedJobs = jobs.sort((a, b) => {
    // First sort by area name (handling null areas)
    const areaA = a.proposedJob.area?.name ?? 'Nezadaná oblast'
    const areaB = b.proposedJob.area?.name ?? 'Nezadaná oblast'
    const areaComparison = areaA.localeCompare(areaB)

    if (areaComparison !== 0) {
      return areaComparison
    }

    // If areas are the same, sort by original job ID
    return a.id.localeCompare(b.id)
  })

  // Reassign sequential IDs
  for (let i = 1; i <= sortedJobs.length; i++) {
    sortedJobs[i - 1].seqId = i
  }

  return sortedJobs
}
