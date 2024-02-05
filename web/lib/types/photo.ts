import { customErrorMessages } from 'lib/lang/error-messages'
import { z } from 'zod'

export const photoFile = z
  .custom<File[]>()
  .transform((file) => file.length > 0 && file[0])
  .refine((file) => !file || (!!file && file.size <= 1024*1024*10), customErrorMessages.maxCapacityImage) // 10 mB = 1024*1024*10
  .refine((file) => !file || (!!file && file.type?.startsWith("image")), customErrorMessages.unsuportedTypeImage) // any image

export const PhotoSchema = z.object({
  photoFile: photoFile
})

export type PhotoDataInput = z.input<typeof PhotoSchema>
export type PhotoData = z.infer<typeof PhotoSchema>

export const PhotoUpdateSchema = PhotoSchema.partial().strict()

export type PhotoUpdateDataInput = z.input<typeof PhotoSchema>
export type PhotoUpdateData = z.infer<typeof PhotoSchema>