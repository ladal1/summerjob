import {
  RideSchema,
  WorkerSchema,
  CarSchema,
  ActiveJobSchema,
  PlanSchema,
} from 'lib/prisma/zod'
import { z } from 'zod'
import { ActiveJobWithProposedSchema } from './active-job'
import { ProposedJobWithAreaSchema } from './proposed-job'
import { WorkerCompleteSchema } from './worker'
import useZodOpenApi from 'lib/api/useZodOpenApi'

useZodOpenApi

// These schemas cause circular dependencies, so we need to define them in one file

export const RideCompleteSchema = RideSchema.extend({
  driver: WorkerSchema,
  car: CarSchema,
  job: ActiveJobWithProposedSchema,
  passengers: z.array(WorkerSchema),
})

export const ActiveJobNoPlanSchema = ActiveJobSchema.extend({
  workers: z.array(WorkerCompleteSchema),
  proposedJob: ProposedJobWithAreaSchema,
  rides: z.array(RideCompleteSchema),
  responsibleWorker: WorkerSchema.or(z.null()),
}).openapi({
  title: 'ActiveJobNoPlan',
})

export const ActiveJobCompleteSchema = ActiveJobSchema.extend({
  workers: z.array(WorkerCompleteSchema),
  proposedJob: ProposedJobWithAreaSchema,
  rides: z.array(RideCompleteSchema),
  responsibleWorker: WorkerSchema.optional(),
  plan: PlanSchema,
})
