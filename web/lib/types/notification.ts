import { z } from 'zod'
import useZodOpenApi from 'lib/api/useZodOpenApi'

useZodOpenApi

const NotificationBasicSchema = z
  .object({
    workerId: z.uuid(),
    body: z.string().min(1),
  })
  .strict()

export const NotificationCreateSchema = NotificationBasicSchema
export type NotificationCreateData = z.infer<typeof NotificationCreateSchema>
