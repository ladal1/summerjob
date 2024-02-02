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
      name: z.string().min(1),
      description: z.string().min(1),
      responsibleWorkerName: z.string().min(1),
      workerNames: z.array(z.string().min(1)),
      contact: z.string().min(1),
      allergens: z.array(z.string().min(1)),
      location: z.object({
        name: z.string().min(1),
        address: z.string().min(1),
      }),
      hasFood: z.boolean(),
      hasShower: z.boolean(),
      ride: MyRideSchema.optional(),
    })
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
  return myPlan
}

export function serializeMyPlans(plans: MyPlan[]): Serialized {
  console.log(plans)
  return {
    data: JSON.stringify(plans),
  }
}

export function deserializeMyPlans(serialized: Serialized): MyPlan[] {
  const myPlans = JSON.parse(serialized.data)
  for (const myPlan of myPlans) {
    myPlan.day = new Date(myPlan.day)
  }
  return myPlans
}
