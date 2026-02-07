import { z } from 'zod'
import { Serialized } from './serialize'
import { WorkAllergySchema } from 'lib/prisma/zod'
import useZodOpenApi from 'lib/api/useZodOpenApi'
import { customErrorMessages as err } from 'lib/lang/error-messages'

useZodOpenApi

export const WorkAllergyCompleteSchema = WorkAllergySchema

export type WorkAllergyComplete = z.infer<typeof WorkAllergyCompleteSchema>

export function serializeWorkAllergies(
  workAllergies: WorkAllergyComplete[]
): Serialized {
  return {
    data: JSON.stringify(workAllergies),
  }
}

export function deserializeWorkAllergies(
  workAllergies: Serialized
): WorkAllergyComplete[] {
  return JSON.parse(workAllergies.data)
}

const WorkAllergyBasicSchema = z
  .object({
    name: z
      .string({ message: err.emptyName })
      .min(1, { message: err.emptyName })
      .trim(),
  })
  .strict()

export const WorkAllergyCreateSchema = WorkAllergyBasicSchema
export type WorkAllergyCreateData = z.infer<typeof WorkAllergyCreateSchema>

export const WorkAllergyUpdateSchema =
  WorkAllergyCreateSchema.partial().strict()
export type WorkAllergyUpdateData = z.infer<typeof WorkAllergyUpdateSchema>
