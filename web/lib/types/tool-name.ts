import { z } from 'zod'
import { Serialized } from './serialize'
import { ToolNameSchema } from 'lib/prisma/zod'
import useZodOpenApi from 'lib/api/useZodOpenApi'
import { customErrorMessages as err } from 'lib/lang/error-messages'

useZodOpenApi

export const ToolNameCompleteSchema = ToolNameSchema.extend({
  skills: z.array(
    z.object({
      name: z.string(),
      id: z.uuid(),
    })
  ),
  jobTypes: z.array(
    z.object({
      name: z.string(),
      id: z.uuid(),
    })
  ),
})

export type ToolNameComplete = z.infer<typeof ToolNameCompleteSchema>

export function serializeToolNames(toolNames: ToolNameComplete[]): Serialized {
  return {
    data: JSON.stringify(toolNames),
  }
}

export function deserializeToolNames(
  toolNames: Serialized
): ToolNameComplete[] {
  return JSON.parse(toolNames.data)
}

const ToolNameBasicSchema = z
  .object({
    name: z
      .string({ message: err.emptyName })
      .min(1, { message: err.emptyName })
      .trim(),
    skills: z.array(z.uuid()),
    jobTypes: z.array(z.uuid()),
  })
  .strict()

export const ToolNameCreateSchema = ToolNameBasicSchema
export type ToolNameCreateData = z.infer<typeof ToolNameCreateSchema>

export const ToolNameUpdateSchema = ToolNameCreateSchema.partial().strict()
export type ToolNameUpdateData = z.infer<typeof ToolNameUpdateSchema>
