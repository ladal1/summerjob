import { z } from 'zod'

export const photoPath = z
  .string()
  .nullable()

export const PhotoPathSchema = z.object({
  photoPath: photoPath
}).strict()

export type PhotoPathData = z.infer<typeof PhotoPathSchema>

export const PhotoPathSchemaTest = z.object({
  photoPath: z.string()
}).strict()

export type PhotoPathDataTest = z.infer<typeof PhotoPathSchemaTest>

export const PhotoIdsSchemaTest = z.object({
  photoIds: z.array(z.string())
}).strict()

export type PhotoIdsDataTest = z.infer<typeof PhotoIdsSchemaTest>
