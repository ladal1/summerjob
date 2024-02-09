import { customErrorMessages } from 'lib/lang/error-messages'
import { z } from 'zod'
import useZodOpenApi from 'lib/api/useZodOpenApi'

useZodOpenApi

export const photoFile = z
  .custom<File[]>()
  .transform((file) => file.length > 0 && file[0])
  .refine((file) => !file || (!!file && file.size <= 1024*1024*10), customErrorMessages.maxCapacityImage) // 10 mB = 1024*1024*10
  .refine((file) => !file || (!!file && file.type?.startsWith("image")), customErrorMessages.unsuportedTypeImage) // any image
  .optional()

// -------------------------------------------------------------------------

export const photoPath = z
  .string()
  .nullable()
  .optional()

export const PhotoPathSchema = z.object({
  photoPath: photoPath
}).strict()

export type PhotoPathData = z.infer<typeof PhotoPathSchema>