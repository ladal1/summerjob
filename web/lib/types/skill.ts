import { z } from 'zod'
import { Serialized } from './serialize'
import { SkillHasSchema } from 'lib/prisma/zod'
import useZodOpenApi from 'lib/api/useZodOpenApi'
import { customErrorMessages as err } from 'lib/lang/error-messages'

useZodOpenApi

export const SkillHasCompleteSchema = SkillHasSchema

export type SkillHasComplete = z.infer<typeof SkillHasCompleteSchema>

export function serializeSkills(skills: SkillHasComplete[]): Serialized {
  return {
    data: JSON.stringify(skills),
  }
}

export function deserializeSkills(skills: Serialized): SkillHasComplete[] {
  return JSON.parse(skills.data)
}

const SkillHasBasicSchema = z
  .object({
    name: z
      .string({ message: err.emptyName })
      .min(1, { message: err.emptyName })
      .trim(),
  })
  .strict()

export const SkillHasCreateSchema = SkillHasBasicSchema
export type SkillHasCreateData = z.infer<typeof SkillHasCreateSchema>

export const SkillHasUpdateSchema = SkillHasCreateSchema.partial().strict()
export type SkillHasUpdateData = z.infer<typeof SkillHasUpdateSchema>
