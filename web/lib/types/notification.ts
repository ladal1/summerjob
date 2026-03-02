import { z } from 'zod'
import useZodOpenApi from 'lib/api/useZodOpenApi'

useZodOpenApi

const NotificationBasicSchema = z
  .object({
    workerIds: z.array(z.uuid()),
    text: z.string().min(1),
  })
  .strict()

export const NotificationCreateSchema = NotificationBasicSchema
export type NotificationCreateData = z.infer<typeof NotificationCreateSchema>

export const FrontendNotificationSchema = z.object({
  id: z.uuid(),
  text: z.string().min(1),
  receivedAt: z.date(),
  seen: z.boolean(),
})
export type FrontentNotificationData = z.infer<
  typeof FrontendNotificationSchema
>

export type NotificationTarget =
  | { type: 'everyone' }
  | { type: 'working-on-day'; date: Date }
  | { type: 'working-on-job'; jobId: string }
  | { type: 'signed-up-for-post'; postId: string }
  | { type: 'food-allergies' }

export type NotificationMulticastRequest = {
  payload: string
  target: NotificationTarget
}
