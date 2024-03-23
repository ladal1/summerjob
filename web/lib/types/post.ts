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
    availability: z
      .array(z.date().or(z.string().min(1).pipe(z.coerce.date())))
      .openapi({
        type: 'array',
        items: {
          type: 'string',
          format: 'date',
        },
      }),
    timeFrom: z
      .string()
      .refine(
        time => time === null || time.length === 0 || validateTimeInput(time),
        {
          message: err.invalidRegexTime,
        }
      )
      .transform(time => {
        if (time !== null && time.length === 0) {
          return null
        }
        return time
      })
      .nullable(),
    timeTo: z
      .string()
      .refine(
        time => time === null || time.length === 0 || validateTimeInput(time),
        {
          message: err.invalidRegexTime,
        }
      )
      .transform(time => {
        if (time !== null && time.length === 0) {
          return null
        }
        return time
      })
      .nullable(),
    address: z.string(),
    coordinates: coordinatesZod.optional(),
    shortDescription: z.string().min(1, { message: err.emptyShortDescription }),
    longDescription: z.string(),
    photoFile: z
      .any()
      .refine(fileList => fileList instanceof FileList, err.invalidTypeFile)
      .transform(
        fileList =>
          (fileList && fileList.length > 0 && fileList[0]) || null || undefined
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
      .nullable()
      .optional(),
    photoFileRemoved: z.boolean().optional(),
    photoPath: z.string().optional(),
    tags: z.array(z.nativeEnum(PostTag)),
    isMandatory: z.boolean().optional(),
    isOpenForParticipants: z.boolean().optional(),
  })
  .strict()

export type PostCreateDataInput = z.input<typeof PostCreateSchema>
export type PostCreateData = z.infer<typeof PostCreateSchema>

export const PostUpdateSchema = PostCreateSchema.merge(
  z.object({
    isPinned: z.boolean(),
  })
)
  .strict()
  .partial()

export type PostUpdateDataInput = z.input<typeof PostUpdateSchema>
export type PostUpdateData = z.infer<typeof PostUpdateSchema>

export function serializePost(data: PostComplete): Serialized {
  return {
    data: JSON.stringify(data),
  }
}

export function deserializePost(data: Serialized) {
  const parsed = JSON.parse(data.data) as PostComplete
  return deserializePostsDates(parsed)
}

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
  return post
}
