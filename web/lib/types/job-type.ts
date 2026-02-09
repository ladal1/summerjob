import { z } from 'zod'
import { Serialized } from './serialize'
import { JobTypeSchema } from 'lib/prisma/zod'
import useZodOpenApi from 'lib/api/useZodOpenApi'
import { customErrorMessages as err } from 'lib/lang/error-messages'

useZodOpenApi

export const JobTypeCompleteSchema = JobTypeSchema

export type JobTypeComplete = z.infer<typeof JobTypeCompleteSchema>

export function serializeJobTypes(jobTypes: JobTypeComplete[]): Serialized {
  return {
    data: JSON.stringify(jobTypes),
  }
}

export function deserializeJobTypes(jobTypes: Serialized): JobTypeComplete[] {
  return JSON.parse(jobTypes.data)
}

const JobTypeBasicSchema = z
  .object({
    name: z
      .string({ message: err.emptyName })
      .min(1, { message: err.emptyName })
      .trim(),
  })
  .strict()

export const JobTypeCreateSchema = JobTypeBasicSchema
export type JobTypeCreateData = z.infer<typeof JobTypeCreateSchema>

export const JobTypeUpdateSchema = JobTypeCreateSchema.partial().strict()
export type JobTypeUpdateData = z.infer<typeof JobTypeUpdateSchema>
