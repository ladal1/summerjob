import { z } from 'zod'

export const photoPath = z
  .string()
  .nullable()

export const PhotoPathSchema = z.object({
  photoPath: photoPath
}).strict()

export type PhotoPathData = z.infer<typeof PhotoPathSchema>