import { z } from 'zod'
import { Serialized } from './serialize'
import useZodOpenApi from 'lib/api/useZodOpenApi'

useZodOpenApi

export const MyRideSchema = z.object({
  car: z.string().min(1),
  isDriver: z.boolean(),
  driverName: z.string().min(1),
  driverPhone: z.string().min(1),
  endsAtMyJob: z.boolean(),
  endJobName: z.string().min(1),
})

export type MyRide = z.infer<typeof MyRideSchema>

export const WorkerContactSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(1),
})

export const WorkerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  responsibleWorker: z.boolean(),
})

export const MyPlanSchema = z.object({
  day: z
    .date()
    .or(z.string().min(1).pipe(z.coerce.date()))
    .openapi({
      type: 'array',
      items: {
        type: 'string',
        format: 'date',
      },
    }),
  job: z
    .object({
      seqNum: z.string().optional(),
      name: z.string().min(1),
      description: z.string().min(1),
      workerNames: z.array(WorkerSchema),
      contact: z.string().min(1),
      allergens: z.array(z.string().min(1)),
      location: z.object({
        name: z.string().min(1),
        address: z.string().min(1),
        coordinates: z.tuple([z.number(), z.number()]).nullable(),
      }),
      hasFood: z.boolean(),
      hasShower: z.boolean(),
      ride: MyRideSchema.optional(),
    })
    .optional(),
  adorations: z
    .array(
      z.object({
        startTime: z.date(),
        endTime: z.date(),
        location: z.string().min(1),
        previousWorkers: z.array(WorkerContactSchema).optional(),
        nextWorkers: z.array(WorkerContactSchema).optional(),
        sameTimeWorkers: z.array(WorkerContactSchema).optional(),
      })
    )
    .optional(),
})

export type MyPlan = z.infer<typeof MyPlanSchema>

export function serializeMyPlan(plan: MyPlan): Serialized {
  return {
    data: JSON.stringify(plan),
  }
}

export function deserializeMyPlan(serialized: Serialized): MyPlan {
  const myPlan = JSON.parse(serialized.data)
  myPlan.day = new Date(myPlan.day)
  if (myPlan.adorations) {
    myPlan.adorations = myPlan.adorations.map((adoration: {
      startTime: string;
      endTime: string;
      location: string;
      previousWorkers?: Array<{ firstName: string; lastName: string; phone: string }>;
      nextWorkers?: Array<{ firstName: string; lastName: string; phone: string }>;
      sameTimeWorkers?: Array<{ firstName: string; lastName: string; phone: string }>;
    }) => ({
      ...adoration,
      startTime: new Date(adoration.startTime),
      endTime: new Date(adoration.endTime),
    }))
  }
  return myPlan
}

export function serializeMyPlans(plans: MyPlan[]): Serialized {
  return {
    data: JSON.stringify(plans),
  }
}

export function deserializeMyPlans(serialized: Serialized): MyPlan[] {
  const myPlans = JSON.parse(serialized.data)
  for (const myPlan of myPlans) {
    myPlan.day = new Date(myPlan.day)
    if (myPlan.adorations) {
      myPlan.adorations = myPlan.adorations.map((adoration: {
        startTime: string;
        endTime: string;
        location: string;
        previousWorkers?: Array<{ firstName: string; lastName: string; phone: string }>;
        nextWorkers?: Array<{ firstName: string; lastName: string; phone: string }>;
        sameTimeWorkers?: Array<{ firstName: string; lastName: string; phone: string }>;
      }) => ({
        ...adoration,
        startTime: new Date(adoration.startTime),
        endTime: new Date(adoration.endTime),
      }))
    }
  }
  return myPlans
}
