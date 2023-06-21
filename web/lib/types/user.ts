import { z } from 'zod'
import { Permission } from './auth'
import { Serialized } from './serialize'
import { WorkerAvailabilitySchema } from 'lib/prisma/zod'

export const UserCompleteSchema = z
  .object({
    id: z.string().min(1).uuid(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    blocked: z.boolean().default(false),
    permissions: z.array(z.nativeEnum(Permission)),
    availability: z.array(WorkerAvailabilitySchema),
  })
  .strict()

export type UserComplete = z.infer<typeof UserCompleteSchema>

const PermissionEnum = z.nativeEnum(Permission)
type PermissionEnum = z.infer<typeof PermissionEnum>
export const UserUpdateSchema = z
  .object({
    blocked: z.boolean(),
    permissions: z.array(PermissionEnum),
  })
  .partial()
  .strict()

export type UserUpdateData = z.infer<typeof UserUpdateSchema>

export function serializeUser(user: UserComplete): Serialized {
  return { data: JSON.stringify(user) }
}

export function deserializeUser(serialized: Serialized): UserComplete {
  return JSON.parse(serialized.data)
}

export function serializeUsers(users: UserComplete[]): Serialized {
  return { data: JSON.stringify(users) }
}

export function deserializeUsers(serialized: Serialized): UserComplete[] {
  return JSON.parse(serialized.data)
}
