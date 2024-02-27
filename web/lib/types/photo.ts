import { z } from 'zod'

export const PhotoPathSchema = z.object({
  photoPath: z.string()
}).strict()

export type PhotoPathData = z.infer<typeof PhotoPathSchema>

export const PhotoIdsSchema = z.object({
  photoIds: z.array(z.string())
}).strict()

export type PhotoIdsData = z.infer<typeof PhotoIdsSchema>
