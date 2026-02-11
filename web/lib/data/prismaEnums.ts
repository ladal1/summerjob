import { ApplicationStatusSchema, PostTagSchema } from 'lib/prisma/zod'

// Lightweight enum-like constants derived from Zod schemas to avoid bundling Prisma on the client.
export const PostTag = PostTagSchema.enum
export type PostTag = keyof typeof PostTag

export const ApplicationStatus = ApplicationStatusSchema.enum
export type ApplicationStatus = keyof typeof ApplicationStatus
