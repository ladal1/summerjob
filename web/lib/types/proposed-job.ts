import { z } from 'zod'
import { Serialized } from './serialize'
import { ActiveJobSchema, AreaSchema, ProposedJobSchema } from 'lib/prisma/zod'
import useZodOpenApi from 'lib/api/useZodOpenApi'
import { Allergy, JobType } from '../prisma/client'

useZodOpenApi

export const ProposedJobWithAreaSchema = ProposedJobSchema.extend({
  area: AreaSchema,
})

export type ProposedJobWithArea = z.infer<typeof ProposedJobWithAreaSchema>

export const ProposedJobCompleteSchema = ProposedJobSchema.extend({
  area: AreaSchema,
  activeJobs: z.array(ActiveJobSchema),
  availability: z.array(z.date()),
})

export type ProposedJobComplete = z.infer<typeof ProposedJobCompleteSchema>

export const ProposedJobCreateSchema = z
  .object({
    areaId: z.string().min(1),
    allergens: z.array(z.nativeEnum(Allergy)),
    privateDescription: z.string(),
    publicDescription: z.string(),
    name: z.string().min(1),
    address: z.string().min(1),
    contact: z.string().min(1),
    maxWorkers: z.number().min(1),
    minWorkers: z.number().min(1),
    strongWorkers: z.number().nonnegative(),
    requiredDays: z.number().min(1),
    hasFood: z.boolean(),
    hasShower: z.boolean(),
    availability: z
      .array(z.date().or(z.string().min(1).pipe(z.coerce.date())))
      .openapi({
        type: 'array',
        items: {
          type: 'string',
          format: 'date',
        },
      }),
    jobType: z.nativeEnum(JobType),
  })
  .strict()

export type ProposedJobCreateDataInput = z.input<typeof ProposedJobCreateSchema>
export type ProposedJobCreateData = z.infer<typeof ProposedJobCreateSchema>

export const ProposedJobUpdateSchema = ProposedJobCreateSchema.merge(
  z.object({
    completed: z.boolean(),
    pinned: z.boolean(),
    hidden: z.boolean(),
  })
)
  .strict()
  .partial()

export type ProposedJobUpdateDataInput = z.input<typeof ProposedJobUpdateSchema>
export type ProposedJobUpdateData = z.infer<typeof ProposedJobUpdateSchema>

export function serializeProposedJobs(jobs: ProposedJobComplete[]): Serialized {
  return { data: JSON.stringify(jobs) }
}

export function deserializeProposedJobs(jobs: Serialized) {
  return JSON.parse(jobs.data) as ProposedJobComplete[]
}

export function serializeProposedJob(job: ProposedJobComplete): Serialized {
  return {
    data: JSON.stringify(job),
  }
}

export function deserializeProposedJob(job: Serialized) {
  const parsed = JSON.parse(job.data) as ProposedJobComplete
  return deserializeProposedJobAvailability(parsed)
}

export function deserializeProposedJobAvailability(job: ProposedJobComplete) {
  job.availability = job.availability.map(date => new Date(date))
  return job
}
