import { z } from 'zod'
import useZodOpenApi from 'lib/api/useZodOpenApi'
import { ToolSchema } from 'lib/prisma/zod'
import { customErrorMessages as err } from 'lib/lang/error-messages'
import { ToolName } from './enums'

useZodOpenApi

export const ToolCompleteSchema = ToolSchema

export type ToolComplete = z.infer<typeof ToolCompleteSchema>
export type ToolCompleteData = z.infer<typeof ToolCompleteSchema>

export const ToolCreateSchema = z
  .object({
    id: z.string().optional(),
    tool: z.nativeEnum(ToolName),
    amount: z
      .number({ message: err.invalidTypeNumber })
      .int({ message: err.nonInteger })
      .positive({ message: err.nonPositiveNumber })
      .default(1),
    proposedJobOnSiteId: z.string().nullable().optional(),
    proposedJobToTakeWithId: z.string().nullable().optional(),
  })
  .strict()

export type ToolCreateDataInput = z.input<typeof ToolCreateSchema>
export type ToolCreateData = z.infer<typeof ToolCreateSchema>

export const ToolUpdateSchema = ToolCreateSchema.partial().strict()

export type ToolUpdateDataInput = z.input<typeof ToolUpdateSchema>
export type ToolUpdateData = z.infer<typeof ToolUpdateSchema>

export const ToolsCreateSchema = z
  .object({
    tools: z.array(ToolCreateSchema),
  })
  .strict()

export type ToolsCreateDataInput = z.input<typeof ToolsCreateSchema>
export type ToolsCreateData = z.infer<typeof ToolsCreateSchema>

export const ToolsUpdateSchema = ToolsCreateSchema.partial().strict()

export type ToolsUpdateDataInput = z.input<typeof ToolsUpdateSchema>
export type ToolsUpdateData = z.infer<typeof ToolsUpdateSchema>
