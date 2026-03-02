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

export const NotificationTargetSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('everyone') }).strict(),
  z
    .object({ type: z.literal('working-on-day'), date: z.string().min(1) })
    .strict(),
  z
    .object({ type: z.literal('working-on-job'), jobId: z.string().min(1) })
    .strict(),
  z
    .object({
      type: z.literal('signed-up-for-post'),
      postId: z.string().min(1),
    })
    .strict(),
  z.object({ type: z.literal('food-allergies') }).strict(),
])
export type NotificationTarget = z.infer<typeof NotificationTargetSchema>

export const NotificationMulticastRequestSchema = z.object({
  payload: z.string().trim().min(1),
  target: NotificationTargetSchema,
})
