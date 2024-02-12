import { z } from 'zod'
import { Serialized } from './serialize'
import { ActiveJobSchema, AreaSchema, ProposedJobSchema } from 'lib/prisma/zod'
import useZodOpenApi from 'lib/api/useZodOpenApi'
import { Allergy, JobType } from '../prisma/client'
import { customErrorMessages as err } from 'lib/lang/error-messages'

useZodOpenApi

export const ProposedJobWithAreaSchema = ProposedJobSchema.extend({
  area: AreaSchema.nullable(),
})

export type ProposedJobWithArea = z.infer<typeof ProposedJobWithAreaSchema>

export const ProposedJobCompleteSchema = ProposedJobSchema.extend({
  area: AreaSchema.nullable(),
  activeJobs: z.array(ActiveJobSchema),
  availability: z.array(z.date()),
})

export type ProposedJobComplete = z.infer<typeof ProposedJobCompleteSchema>

export const ProposedJobCreateSchema = z
  .object({
    areaId: z.string().min(1, { message: err.emptyAreaId }),
    allergens: z.array(z.nativeEnum(Allergy)),
    privateDescription: z.string(),
    publicDescription: z.string(),
    name: z.string().min(1, { message: err.emptyProposedJobName }),
    address: z.string().min(1, { message: err.emptyAdress }),
    contact: z.string().min(1, { message: err.emptyContactInformation }),
    maxWorkers: z
      .number({ invalid_type_error: err.invalidTypeMaxWorkers })
      .min(1, {message: err.emptyMaxWorkers })
      .positive({ message: err.nonPositiveMaxWorkers })
      .default(1),
    minWorkers: z
      .number({ invalid_type_error: err.invalidTypeMinWorkers })
      .min(1, { message: err.emptyMinWorkers })
      .positive({ message: err.nonPositiveMinWorkers })
      .default(1),
    strongWorkers: z
      .number({ invalid_type_error: err.invalidTypeStrongWorkers })
      .nonnegative({ message: err.nonNonNegativeStrongWorkers })
      .default(0),
    requiredDays: z
      .number({ invalid_type_error: err.invalidTypeNumber })
      .min(1, { message: err.emptyRequiredDays })
      .positive({ message: err.nonPositiveNumber })
      .default(1),
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
