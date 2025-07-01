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
  participants: z.array(
    z.object({
      workerId: z.string(),
      worker: z.object({ firstName: z.string(), lastName: z.string() }),
    })
  ),
  maxParticipants: z.number().nullable(),
})

export type PostComplete = z.infer<typeof PostCompleteSchema>

const PostBasicSchema = z
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
    address: z.string().nullable().optional(),
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
    tags: z.array(z.nativeEnum(PostTag)).optional(),
    isMandatory: z.boolean().optional(),
    isOpenForParticipants: z.boolean().optional(),
    maxParticipants: z.number().positive().nullable(),
  })
  .strict()

export const PostCreateSchema = PostBasicSchema.superRefine((value, ctx) => {
  if (
    (value.timeFrom === null && value.timeTo !== null) ||
    (value.timeFrom !== null && value.timeTo === null)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: err.bothTimes,
      path: ['timeFrom'],
    })
  }

  if (
    value.timeFrom !== null &&
    value.timeTo !== null &&
    value.timeFrom.localeCompare(value.timeTo) > 0
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: err.timeMoreThanOrEqualOtherTime,
      path: ['timeFrom'],
    })
  }
})

export type PostCreateDataInput = z.input<typeof PostCreateSchema>
export type PostCreateData = z.infer<typeof PostCreateSchema>

/* Note: because refine returns ZodEffects, there is no way to apply for example merge as on ZodObject,
this issue is discussed here: https://github.com/colinhacks/zod/issues/2474
for now it is settled that there will be duplicates of code (using same refine) */
export const PostUpdateSchema = PostBasicSchema.merge(
  z.object({
    isPinned: z.boolean(),
    participateChange: z.object({
      workerId: z.string(),
      isEnrolled: z.boolean(),
    }),
    participantManagement: z
      .object({
        addParticipantIds: z.array(z.string()).optional(),
        removeParticipantIds: z.array(z.string()).optional(),
      })
      .optional(),
  })
)
  .strict()
  .partial()
  .superRefine((value, ctx) => {
    if (
      (value.timeFrom === null && value.timeTo !== null) ||
      (value.timeFrom !== null && value.timeTo === null)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: err.bothTimes,
        path: ['timeFrom'],
      })
    }
    if (
      value.timeFrom !== null &&
      value.timeTo !== null &&
      value.timeFrom !== undefined &&
      value.timeTo !== undefined &&
      value.timeFrom.localeCompare(value.timeTo) > 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: err.timeMoreThanOrEqualOtherTime,
        path: ['timeFrom'],
      })
    }
  })
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
  post.availability = post.availability.map(date => {
    const newDate = new Date(date)
    return newDate
  })
  return post
}

export const PostFilterSchema = z
  .object({
    availability: z.array(z.date().or(z.string().min(1).pipe(z.coerce.date()))),
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
    tags: z.array(z.nativeEnum(PostTag)).optional(),
    participate: z.boolean(),
    showAll: z.boolean(),
    showPast: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (
      value.timeFrom !== null &&
      value.timeTo !== null &&
      value.timeFrom.localeCompare(value.timeTo) > 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: err.timeMoreThanOrEqualOtherTime,
        path: ['timeFrom'],
      })
    }
  })

export type PostFilterDataInput = z.input<typeof PostFilterSchema>
export type PostFilterData = z.infer<typeof PostFilterSchema>
