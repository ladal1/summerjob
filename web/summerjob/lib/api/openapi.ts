import {
  OpenAPIGenerator,
  OpenAPIRegistry,
} from "@asteasolutions/zod-to-openapi";
import { CarSchema, WorkerSchema } from "lib/prisma/zod";
import { Allergy } from "lib/types/allergy";
import {
  CarCompleteSchema,
  CarCreateSchema,
  CarUpdateSchema,
} from "lib/types/car";
import { WorkerCreateSchema, WorkersCreateSchema } from "lib/types/worker";
import { z } from "zod";

const registry = new OpenAPIRegistry();

//#region Allergies

registry.register("Allergy", z.nativeEnum(Allergy));

registry.registerPath({
  path: "/api/allergies",
  method: "get",
  description: "Gets a list of supported allergies.",
  summary: "List all supported allergies",
  tags: ["Allergies"],
  responses: {
    200: {
      description: "List of supported allergies",
      content: {
        "application/json": {
          schema: z.array(z.nativeEnum(Allergy)),
        },
      },
    },
  },
});

//#endregion

//#region Cars

registry.register("CarDetails", CarCompleteSchema);

registry.registerPath({
  path: "/api/cars",
  method: "get",
  description:
    "Gets a list of available cars for the current event. Permissions required (at least one): ADMIN, CARS, PLANS.",
  summary: "List all available cars",
  tags: ["Cars"],
  responses: {
    200: {
      description: "List of available cars",
      content: {
        "application/json": {
          schema: z.array(CarCompleteSchema),
        },
      },
    },
    409: {
      description: "No active SummerJob event is set.",
    },
  },
});

registry.register("Car", CarSchema);
registry.register("CarCreate", CarCreateSchema);

registry.registerPath({
  path: "/api/cars",
  method: "post",
  description:
    "Creates a new car in the current event. The owner must be registered in the event. Permissions required (at least one): ADMIN, CARS, PLANS.",
  summary: "Create a new car",
  tags: ["Cars"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CarCreateSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Car created successfully. Returns the created car.",
      content: {
        "application/json": {
          schema: CarSchema,
        },
      },
    },
    409: {
      description: "No active SummerJob event is set.",
    },
  },
});

registry.register("CarUpdate", CarUpdateSchema);

registry.registerPath({
  path: "/api/cars/{id}",
  method: "put",
  description:
    "Updates a car. Permissions required (at least one): ADMIN, CARS, PLANS.",
  summary: "Update a car",
  tags: ["Cars"],
  parameters: [
    {
      name: "id",
      in: "path",
      required: true,
      description: "The ID of the car to update.",
      schema: {
        type: "string",
      },
    },
  ],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CarUpdateSchema,
        },
      },
    },
  },
  responses: {
    204: {
      description: "Car updated successfully.",
    },
  },
});

registry.registerPath({
  path: "/api/cars/{id}",
  method: "delete",
  description:
    "Deletes a car. Permissions required (at least one): ADMIN, CARS, PLANS.",
  summary: "Delete a car",
  tags: ["Cars"],
  parameters: [
    {
      name: "id",
      in: "path",
      required: true,
      description: "The ID of the car to delete.",
      schema: {
        type: "string",
      },
    },
  ],
  responses: {
    204: {
      description: "Car deleted successfully.",
    },
  },
});

//#endregion

registry.register("WorkerCreate", WorkerCreateSchema);
registry.register("WorkersCreate", WorkersCreateSchema);

registry.registerPath({
  path: "/api/workers",
  method: "post",
  description:
    "Creates a new worker in the currently active event. If a worker with the same e-mail address is already registered in previous events, the worker will be automatically added to the current event. The worker will be able to sign in immediately. Permissions required (at least one): ADMIN, WORKERS, PLANS.",
  summary: "Create one or multiple new workers",
  tags: ["Workers"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: WorkerCreateSchema.or(WorkersCreateSchema),
        },
      },
    },
  },
  responses: {
    201: {
      description:
        "Worker(s) created successfully. Returns the created worker(s).",
      content: {
        "application/json": {
          schema: WorkerSchema,
        },
      },
    },
    409: {
      description: "No active SummerJob event is set.",
    },
  },
});

const generator = new OpenAPIGenerator(registry.definitions, "3.0.0");
let openApiDocument = {};
try {
  openApiDocument = generator.generateDocument({
    info: {
      title: "SummerJob API",
      version: "1.0",
      description:
        "All endpoints require session cookies to be set. Before you start trying the commands below, you must sign into the SummerJob website to obtain session cookie.",
    },
  });
} catch (err) {
  console.log("Nastala chyba při generování dokumentu OpenAPI");
  console.error(err);
}

export default openApiDocument;
