import { z } from 'zod'
import useZodOpenApi from 'lib/api/useZodOpenApi'

useZodOpenApi

const NotificationBasicSchema = z
  .object({
    workerId: z.uuid(),
    title: z.string().min(1),
    body: z.string().min(1),
    url: z.url().optional().nullable(),
  })
  .strict()

export const NotificationCreateSchema = NotificationBasicSchema
export type NotificationCreateData = z.infer<typeof NotificationCreateSchema>
