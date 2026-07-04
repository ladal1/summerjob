import { z } from 'zod'
import useZodOpenApi from 'lib/api/useZodOpenApi'

useZodOpenApi

const PushSubscriptionBasicSchema = z
  .object({
    workerId: z.uuid(),
    endpoint: z.string(),
    p256dh: z.string(),
    auth: z.string(),
  })
  .strict()

export const BrowserPushSubscriptionSchema = z
  .object({
    endpoint: z.url(),
    expirationTime: z.number().nullable().optional(),
    keys: z
      .object({
        p256dh: z.string().min(1),
        auth: z.string().min(1),
      })
      .strict(),
  })
  .strict()

export const PushSubscriptionCreateSchema = PushSubscriptionBasicSchema
export type PushSubscriptionCreateData = z.infer<
  typeof PushSubscriptionCreateSchema
>

export type BrowserPushSubscriptionData = z.infer<
  typeof BrowserPushSubscriptionSchema
>
