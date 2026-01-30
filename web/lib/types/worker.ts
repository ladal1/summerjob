import { z } from 'zod'
import useZodOpenApi from 'lib/api/useZodOpenApi'
import { customErrorMessages as err } from 'lib/lang/error-messages'
import {
  CarSchema,
  WorkerAvailabilitySchema,
  WorkerSchema,
} from 'lib/prisma/zod'
import { Serialized } from './serialize'
import { FoodAllergy, WorkAllergy, SkillHas, SkillBrings } from './enums'

useZodOpenApi

export const WorkerCompleteSchema = WorkerSchema.extend({
  cars: z.array(CarSchema),
  availability: WorkerAvailabilitySchema,
  skills: z.array(z.nativeEnum(SkillHas)),
})

export type WorkerComplete = z.infer<typeof WorkerCompleteSchema>

export const WorkerCreateSchema = z
  .object({
    firstName: z
      .string({ message: err.emptyFirstName })
      .min(1, { message: err.emptyFirstName })
      .trim(),
    lastName: z
      .string({ message: err.emptyLastName })
      .min(1, { message: err.emptyLastName })
      .trim(),
    email: z
      .string({ message: err.emptyEmail })
      .min(1, { message: err.emptyEmail })
      .email({ message: err.invalidEmail }),
    phone: z
      .string({ message: err.emptyPhone })
      .min(1, { message: err.emptyPhone })
      .refine(
        phone =>
          /^((?:\+|00)[0-9]{1,3})?[ ]?[0-9]{3}[ ]?[0-9]{3}[ ]?[0-9]{3}$/.test(
            phone
          ),
        {
          message: err.invalidRegexPhone,
        }
      ),
    strong: z.boolean().default(false),
    team: z.boolean().default(false),
    skills: z.array(z.nativeEnum(SkillHas)),
    tools: z.array(z.nativeEnum(SkillBrings)),
    foodAllergies: z.array(z.nativeEnum(FoodAllergy)),
    workAllergies: z.array(z.nativeEnum(WorkAllergy)),
    note: z.string().optional(),
    age: z
      .union([
        z
          .number({ message: err.invalidTypeNumber })
          .int({ message: err.nonInt })
          .positive({ message: err.nonPositiveNumber }),
        z.nan(),
      ])
      .openapi({
        type: 'number',
      })
      .nullable()
      .optional(),
    photoFile: z
      .any()
      .refine(fileList => fileList instanceof FileList, {
        message: err.invalidTypeFile,
      })
      .transform(
        fileList =>
          (fileList && fileList.length > 0 && fileList[0]) || null || undefined
      )
      .refine(file => !file || (!!file && file.size <= 1024 * 1024 * 10), {
        message: err.maxCapacityImage + ' - 10 MB',
      })
      .refine(file => !file || (!!file && file.type?.startsWith('image')), {
        message: err.unsuportedTypeImage,
      }) // any image
      .openapi({ type: 'array', items: { type: 'string', format: 'binary' } })
      .nullable()
      .optional(),
    photoFileRemoved: z.boolean().optional(),
    photoPath: z.string().optional(),
    availability: z.object({
      workDays: z
        .array(z.date().or(z.string().min(1).pipe(z.coerce.date())))
        .openapi({
          type: 'array',
          items: {
            type: 'string',
            format: 'date',
          },
        }),
    }),
  })
  .strict()

export type WorkerCreateDataInput = z.input<typeof WorkerCreateSchema>
export type WorkerCreateData = z.infer<typeof WorkerCreateSchema>

export const WorkersCreateSchema = z
  .object({
    workers: z.array(WorkerCreateSchema),
  })
  .strict()

export type WorkersCreateDataInput = z.input<typeof WorkersCreateSchema>
export type WorkersCreateData = z.infer<typeof WorkersCreateSchema>

export const WorkerUpdateSchema = WorkerCreateSchema.partial().strict()

export type WorkerUpdateDataInput = z.input<typeof WorkerUpdateSchema>
export type WorkerUpdateData = z.infer<typeof WorkerUpdateSchema>

export type WorkerBasicInfo = {
  id: string
  firstName: string
  lastName: string
}

export function serializeWorker(data: WorkerComplete): Serialized {
  return {
    data: JSON.stringify(data),
  }
}

export function deserializeWorker(data: Serialized) {
  let worker = JSON.parse(data.data) as WorkerComplete
  worker = deserializeWorkerAvailability(worker)
  return worker
}

export function serializeWorkers(data: WorkerComplete[]): Serialized {
  return {
    data: JSON.stringify(data),
  }
}

export function deserializeWorkers(data: Serialized) {
  let workers = JSON.parse(data.data) as WorkerComplete[]
  workers = workers.map(deserializeWorkerAvailability)
  return workers
}

export function deserializeWorkerAvailability(worker: WorkerComplete) {
  worker.availability.workDays = worker.availability.workDays.map(
    day => new Date(day)
  )
  return worker
}
