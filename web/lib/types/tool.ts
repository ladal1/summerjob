import { z } from 'zod'
import useZodOpenApi from 'lib/api/useZodOpenApi'
import { ToolSchema } from 'lib/prisma/zod'
import { ToolName } from 'lib/prisma/client'
import { customErrorMessages as err } from 'lib/lang/error-messages'

useZodOpenApi

export const ToolCompleteSchema = ToolSchema

export type ToolComplete = z.infer<typeof ToolCompleteSchema>

export const ToolCreateSchema = z
  .object({
    tool: z.nativeEnum(ToolName),
    amount: z
      .number({ invalid_type_error: err.invalidTypeNumber })
      .positive({ message: err.nonPositiveNumber })
      .default(1),
    proposedJobOnSiteId: z.string().nullable().optional(),
    proposedJobToTakeWithId: z.string().nullable().optional(),
  })
  .strict()


export type ToolCreateDataInput = z.input<typeof ToolCreateSchema>
export type ToolCreateData = z.infer<typeof ToolCreateSchema>

export const ToolsCreateSchema = z
  .object({
    tools: z.array(ToolCreateSchema),
  })
  .strict()

export type ToolsCreateDataInput = z.input<typeof ToolsCreateSchema>
export type ToolsCreateData = z.infer<typeof ToolsCreateSchema>