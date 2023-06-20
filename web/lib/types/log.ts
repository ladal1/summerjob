import useZodOpenApi from 'lib/api/useZodOpenApi'
import { LoggingSchema } from 'lib/prisma/zod'
import { z } from 'zod'

useZodOpenApi

export const LogsResponseSchema = z.object({
  logs: z.array(LoggingSchema).openapi({ title: 'Log' }),
  total: z.number().openapi({
    description: 'Total number of logs in the database.',
    example: 500,
  }),
})

export type LogsResponse = z.infer<typeof LogsResponseSchema>
