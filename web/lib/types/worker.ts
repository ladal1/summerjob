import { z } from 'zod'
import type { Worker } from '../../lib/prisma/client'
import { Serialized } from './serialize'
import useZodOpenApi from 'lib/api/useZodOpenApi'
import { customErrorMessages as err } from 'lib/lang/error-messages'

import {
  CarSchema,
  WorkerAvailabilitySchema,
  WorkerSchema,
} from 'lib/prisma/zod'
import { Allergy } from '../../lib/prisma/client'
import { photoFile } from './photo'
import { nameRegex, phoneRegex } from 'lib/helpers/regex'


useZodOpenApi

export const WorkerCompleteSchema = WorkerSchema.extend({
  cars: z.array(CarSchema),
  availability: WorkerAvailabilitySchema,
})

export type WorkerComplete = z.infer<typeof WorkerCompleteSchema>

export const WorkerCreateSchema = z
  .object({
    firstName: z
      .string()
      .min(1, { message: err.emptyFirstName })
      .refine((name) => nameRegex.test(name), { message: err.invalidRegexName }),
    lastName: z
      .string()
      .min(1, { message: err.emptyLastName })
      .refine((name) => nameRegex.test(name), { message: err.invalidRegexName }),
    email: z
      .string()
      .min(1, { message: err.emptyEmail })
      .email({ message: err.invalidEmail }),
    phone: z
      .string()
      .min(1, { message: err.emptyPhone })
      .refine((phone) => phoneRegex.test(phone), { message: err.invalidRegexPhone }),
    strong: z.boolean(),
    allergyIds: z.array(z.nativeEnum(Allergy)),
    note: z.string().optional(),
    photoFile: photoFile.optional(),
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
