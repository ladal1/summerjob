import { z } from 'zod'
import useZodOpenApi from 'lib/api/useZodOpenApi'
import { ToolSchema } from 'lib/prisma/zod'
import { ToolName } from 'lib/prisma/client'

useZodOpenApi

export const ToolCompleteSchema = ToolSchema

export type ToolComplete = z.infer<typeof ToolCompleteSchema>

export const ToolCreateSchema = z
  .object({
    tool: z.nativeEnum(ToolName),
    amount: z.number().int().optional(),
  })
  .strict()