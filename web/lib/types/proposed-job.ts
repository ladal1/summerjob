import { z } from 'zod'
import { Serialized } from './serialize'
import { ActiveJobSchema, AreaSchema, ProposedJobSchema } from 'lib/prisma/zod'
import useZodOpenApi from 'lib/api/useZodOpenApi'
import { Allergy, JobType } from '../prisma/client'
import { customErrorMessages as err } from 'lib/lang/error-messages'
import { ToolCompleteSchema, ToolsCreateSchema } from 'lib/types/tool'
import { PhotoCompleteSchema } from './photo'
import { coordinatesZod } from './coordinates'

useZodOpenApi

export const ProposedJobForActiveJobSchema = z.object({
  privateDescription: z.string(),
  publicDescription: z.string(),
  name: z.string().min(1, { message: err.emptyProposedJobName }),
})

export const ProposedJobWithAreaSchema = ProposedJobSchema.extend({
  area: AreaSchema.nullable(),
  toolsOnSite: z.array(ToolCompleteSchema),
  toolsToTakeWith: z.array(ToolCompleteSchema),
})

export type ProposedJobWithArea = z.infer<typeof ProposedJobWithAreaSchema>

export const ProposedJobCompleteSchema = ProposedJobSchema.extend({
  area: AreaSchema.nullable(),
  activeJobs: z.array(ActiveJobSchema),
  availability: z.array(z.date()),
  toolsOnSite: z.array(ToolCompleteSchema),
  toolsToTakeWith: z.array(ToolCompleteSchema),
  photos: z.array(PhotoCompleteSchema),
  pinnedBy: z.array(z.object({ workerId: z.string() })),
})

export type ProposedJobComplete = z.infer<typeof ProposedJobCompleteSchema>

const ProposedJobBasicSchema = z
  .object({
    areaId: z.string({ required_error: err.emptyAreaId }).nullable(),
    allergens: z.array(z.nativeEnum(Allergy)),
    privateDescription: z.string(),
    publicDescription: z.string(),
    name: z
      .string({ required_error: err.emptyProposedJobName })
      .min(1, { message: err.emptyProposedJobName }),
    address: z
      .string({ required_error: err.emptyAdress })
      .min(1, { message: err.emptyAdress }),
    coordinates: coordinatesZod.optional(),
    contact: z.string().min(1, { message: err.emptyContactInformation }),
    maxWorkers: z
      .number({
        invalid_type_error: err.invalidTypeMaxWorkers,
        required_error: err.emptyMaxWorkers,
      })
      .int({ message: err.nonInteger })
      .positive({ message: err.nonPositiveMaxWorkers })
      .default(1),
    minWorkers: z
      .number({
        invalid_type_error: err.invalidTypeMinWorkers,
        required_error: err.emptyMinWorkers,
      })
      .int({ message: err.nonInteger })
      .positive({ message: err.nonPositiveMinWorkers })
      .default(1),
    strongWorkers: z
      .number({
        invalid_type_error: err.invalidTypeStrongWorkers,
        required_error: err.emptyStrongWorkers,
      })
      .int({ message: err.nonInteger })
      .nonnegative({ message: err.nonNonNegativeStrongWorkers })
      .default(0),
    requiredDays: z
      .number({
        invalid_type_error: err.invalidTypeNumber,
        required_error: err.emptyRequiredDays,
      })
      .int({ message: err.nonInteger })
      .positive({ message: err.nonPositiveNumber })
      .default(1),
    hasFood: z.boolean(),
    hasShower: z.boolean(),
    photoFiles: z
      .any()
      .refine(fileList => fileList instanceof FileList, err.invalidTypeFile)
      .refine(fileList => fileList.length <= 10, err.maxCountImage + ' 10')
      .superRefine((fileList, ctx) => {
        for (let i = 0; i < fileList.length; i++) {
          const file = fileList[i]
          if (!file || file.size > 1024 * 1024 * 10) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: err.maxCapacityImage + ' - max 10 MB',
            })
          }
          if (!file || !file.type?.startsWith('image')) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: err.unsuportedTypeImage,
            })
          }
        }
      })
      .openapi({ type: 'array', items: { type: 'string', format: 'binary' } })
      .optional(),
    photoIds: z.array(z.string()).optional(),
    photoIdsDeleted: z.array(z.string()).optional(),
    availability: z
      .array(z.date().or(z.string().min(1).pipe(z.coerce.date())))
      .openapi({
        type: 'array',
        items: {
          type: 'string',
          format: 'date',
        },
      }),
    jobType: z.nativeEnum(JobType, { required_error: err.emptyJobType }),
    toolsOnSiteCreate: ToolsCreateSchema.optional(),
    toolsOnSiteIdsDeleted: z.array(z.string()).optional(),
    toolsToTakeWithCreate: ToolsCreateSchema.optional(),
    toolsToTakeWithIdsDeleted: z.array(z.string()).optional(),
    priority: z.number().optional(),
  })
  .strict()

export const ProposedJobCreateSchema = ProposedJobBasicSchema.superRefine(
  (val, ctx) => {
    if (val.minWorkers > val.maxWorkers) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: err.minWorkerslessThanOrEqualMaxWorkers,
        path: ['minWorkers'],
      })
    }

    if (val.maxWorkers < val.strongWorkers) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: err.strongWorkerslessThanOrEqualMaxWorkers,
        path: ['strongWorkers'],
      })
    }

    if (
      (val.availability === undefined && val.requiredDays > 0) ||
      (val.availability !== undefined &&
        val.availability?.length < val.requiredDays)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: err.requiredDaysLessThanOrEqualAvailability,
        path: ['availability'],
      })
    }
  }
)

export type ProposedJobCreateDataInput = z.input<typeof ProposedJobCreateSchema>
export type ProposedJobCreateData = z.infer<typeof ProposedJobCreateSchema>

export const ProposedJobUpdateSchema = ProposedJobBasicSchema.merge(
  z.object({
    completed: z.boolean(),
    hidden: z.boolean(),
    pinnedByChange: z.object({
      workerId: z.string(),
      pinned: z.boolean(),
    }),
  })
)
  .strict()
  .partial()
  .superRefine((val, ctx) => {
    if (
      val.minWorkers !== undefined &&
      val.maxWorkers !== undefined &&
      val.minWorkers > val.maxWorkers
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: err.minWorkerslessThanOrEqualMaxWorkers,
        path: ['minWorkers'],
      })
    }

    if (
      val.maxWorkers !== undefined &&
      val.strongWorkers !== undefined &&
      val.maxWorkers < val.strongWorkers
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: err.strongWorkerslessThanOrEqualMaxWorkers,
        path: ['strongWorkers'],
      })
    }

    if (
      val.requiredDays !== undefined &&
      ((val.availability === undefined && val.requiredDays > 0) ||
        (val.availability !== undefined &&
          val.availability?.length < val.requiredDays))
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: err.requiredDaysLessThanOrEqualAvailability,
        path: ['availability'],
      })
    }
  })

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
