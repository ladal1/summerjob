import { z } from 'zod'
import { PostSchema } from 'lib/prisma/zod'
import useZodOpenApi from 'lib/api/useZodOpenApi'
import { PostTag } from 'lib/prisma/client'
import { Serialized } from './serialize'
import { customErrorMessages as err } from 'lib/lang/error-messages'
import { coordinatesZod } from './coordinates'
import { validateTimeInput } from 'lib/helpers/helpers'

useZodOpenApi

export const PostCompleteSchema = PostSchema.extend({
  availability: z.array(z.date()),
  tags: z.array(z.nativeEnum(PostTag)),
})

export type PostComplete = z.infer<typeof PostCompleteSchema>

export const PostCreateSchema = z
  .object({
    name: z.string().min(1, { message: err.emptyPostName }).trim(),
    availability: z.array(z.date()).optional(),
    timeFrom: z
      .string()
      .optional()
      .refine(
        time =>
          time === undefined || time.length === 0 || validateTimeInput(time),
        {
          message: err.invalidRegexTime,
        }
      )
      .transform(time => {
        if (time === undefined || time.length === 0) return undefined
        const [hours, minutes] = time.split(':').map(Number)
        const now = new Date()
        now.setHours(hours)
        now.setMinutes(minutes)
        now.setSeconds(0)
        now.setMilliseconds(0)
        return now
      }),
    timeTo: z
      .string()
      .optional()
      .refine(
        time =>
          time === undefined || time.length === 0 || validateTimeInput(time),
        {
          message: err.invalidRegexTime,
        }
      )
      .transform(time => {
        if (time === undefined || time.length === 0) return undefined
        const [hours, minutes] = time.split(':').map(Number)
        const now = new Date()
        now.setHours(hours)
        now.setMinutes(minutes)
        now.setSeconds(0)
        now.setMilliseconds(0)
        return now
      }),
    address: z.string().optional(),
    coordinates: coordinatesZod.optional(),
    shortDescription: z.string().min(1, { message: err.emptyShortDescription }),
    longDescription: z.string().optional(),
    photoFile: z
      .any()
      .refine(fileList => fileList instanceof FileList, err.invalidTypeFile)
      .transform(
        fileList =>
          (fileList && fileList.length > 0 && fileList[0]) || undefined
      )
      .refine(
        file => !file || (!!file && file.size <= 1024 * 1024 * 10),
        err.maxCapacityImage + ' - 10 MB'
      )
      .refine(
        file => !file || (!!file && file.type?.startsWith('image')),
        err.unsuportedTypeImage
      ) // any image
      .openapi({ type: 'array', items: { type: 'string', format: 'binary' } })
      .optional(),
    photoFileRemoved: z.boolean().optional(),
    photoPath: z.string().optional(),
    tags: z.array(z.nativeEnum(PostTag)).optional(),
    isMandatory: z.boolean().optional(),
    isOpenForParticipants: z.boolean().optional(),
  })
  .strict()

export type PostCreateDataInput = z.input<typeof PostCreateSchema>
export type PostCreateData = z.infer<typeof PostCreateSchema>

export const PostUpdateSchema = PostCreateSchema.partial().strict()

export type PostUpdateDataInput = z.input<typeof PostUpdateSchema>
export type PostUpdateData = z.infer<typeof PostUpdateSchema>

export function serializePosts(data: PostComplete[]): Serialized {
  return {
    data: JSON.stringify(data),
  }
}

export function deserializePosts(data: Serialized) {
  const parsed = JSON.parse(data.data) as PostComplete[]
  return parsed.map(item => deserializePostsDates(item))
}

export function deserializePostsDates(post: PostComplete) {
  post.madeIn = new Date(post.madeIn)
  if (post.availability)
    post.availability = post.availability.map(date => new Date(date))
  if (post.timeFrom) post.timeFrom = new Date(post.timeFrom)
  if (post.timeTo) post.timeTo = new Date(post.timeTo)
  return post
}
