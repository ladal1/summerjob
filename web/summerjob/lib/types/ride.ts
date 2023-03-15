import { Car, Ride, Worker } from "lib/prisma/client";
import { z } from "zod";
import { ActiveJobWithProposed } from "./active-job";

export const NO_RIDE = "NO_RIDE";

export type RideWithDriverCarDetails = Ride & {
  driver: Worker;
  car: Car;
};

export type RideComplete = Ride & {
  driver: Worker;
  car: Car;
  job: ActiveJobWithProposed;
  passengers: Worker[];
};

export type RidesForJob = {
  jobId: string;
  jobName: string;
  rides: RideComplete[];
};

export const RideCreateSchema = z
  .object({
    driverId: z.string(),
    carId: z.string(),
    description: z.string().optional(),
    passengerIds: z.array(z.string()),
  })
  .strict();

export type RideCreateData = z.infer<typeof RideCreateSchema>;

export const RideUpdateSchema = RideCreateSchema.omit({
  driverId: true,
  carId: true,
})
  .partial()
  .strict();

export type RideUpdateData = z.infer<typeof RideUpdateSchema>;
