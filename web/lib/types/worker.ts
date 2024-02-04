import { z } from 'zod'
import type { Worker } from '../../lib/prisma/client'
import { Serialized } from './serialize'
import useZodOpenApi from 'lib/api/useZodOpenApi'
import { customErrorMessages } from 'lib/lang/error-messages'

import {
  CarSchema,
  WorkerAvailabilitySchema,
  WorkerSchema,
} from 'lib/prisma/zod'
import { Allergy } from '../../lib/prisma/client'

useZodOpenApi

export const WorkerCompleteSchema = WorkerSchema.extend({
  cars: z.array(CarSchema),
  availability: WorkerAvailabilitySchema,
  photoFile: z.any(),
})

export type WorkerComplete = z.infer<typeof WorkerCompleteSchema>

export const WorkerCreateSchema = z
  .object({
    firstName: z
      .string()
      .min(1, { message: customErrorMessages.emptyFirstName }),
    lastName: z.string().min(1, { message: customErrorMessages.emptyLastName }),
    email: z
      .string()
      .min(1, { message: customErrorMessages.emptyEmail })
      .email({ message: customErrorMessages.invalidEmail }),
    phone: z.string().min(1, { message: customErrorMessages.emptyPhone }),
    strong: z.boolean(),
    allergyIds: z.array(z.nativeEnum(Allergy)),
    note: z.string().optional(),
    photoFile: z
      .custom<FileList>()
      .transform((file) => file.length > 0 && file.item(0))
      .refine((file) => !file || (!!file && file.size <= 1024*1024*10), customErrorMessages.maxCapacityImage) // 10 mB = 1024*1024*10
      .refine((file) => !file || (!!file && file.type?.startsWith("image")), customErrorMessages.unsuportedTypeImage) // any image
      .optional(),
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
      adorationDays: z
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

export type WorkerBasicInfo = Pick<Worker, 'id' | 'firstName' | 'lastName'>

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
  worker.availability.adorationDays = worker.availability.adorationDays.map(
    day => new Date(day)
  )
  return worker
}
