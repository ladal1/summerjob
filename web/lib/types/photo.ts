import { PhotoSchema } from 'lib/prisma/zod'
import { z } from 'zod'

export const PhotoCompleteSchema = PhotoSchema

export type PhotoComplete = z.infer<typeof PhotoCompleteSchema>
export type PhotoCompleteData = z.infer<typeof PhotoCompleteSchema>

export const PhotoPathSchema = z
  .object({
    id: z.string().optional(),
    photoPath: z.string(),
    proposedJobId: z.string().nullable().optional(),
  })
  .strict()

export type PhotoPathData = z.infer<typeof PhotoPathSchema>

export const PhotoCreateSchema = z
  .object({
    photoPath: z.string().nullable(),
  })
  .strict()

export type PhotoCreateData = z.infer<typeof PhotoCreateSchema>

export const PhotoIdsSchema = z
  .object({
    photos: z.array(
      z.object({
        id: z.string(),
      })
    ),
  })
  .strict()

export type PhotoIdsData = z.infer<typeof PhotoIdsSchema>
