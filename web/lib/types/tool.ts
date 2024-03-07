import { z } from 'zod'
import useZodOpenApi from 'lib/api/useZodOpenApi'
import { ToolSchema } from 'lib/prisma/zod'
import { JobType, Skill, ToolName } from 'lib/prisma/client'
import { customErrorMessages as err } from 'lib/lang/error-messages'

useZodOpenApi

export const ToolCompleteSchema = ToolSchema

export type ToolComplete = z.infer<typeof ToolCompleteSchema>

export const ToolCreateSchema = z
  .object({
    tool: z.nativeEnum(ToolName, { required_error: err.emptyJobType }),
    amount: z.number().int().optional(),
  })
  .strict()