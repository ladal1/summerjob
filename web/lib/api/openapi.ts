import {
  OpenAPIGenerator,
  OpenAPIRegistry,
} from '@asteasolutions/zod-to-openapi'
import {
  ActiveJobSchema,
  AreaSchema,
  CarSchema,
  LoggingSchema,
  PlanSchema,
  ProposedJobSchema,
  RideSchema,
  SummerJobEventSchema,
  WorkerSchema,
} from 'lib/prisma/zod'
import {
  ActiveJobCompleteSchema,
  ActiveJobNoPlanSchema,
} from 'lib/types/_schemas'
import {
  ActiveJobCreateMultipleSchema,
  ActiveJobCreateSchema,
  ActiveJobUpdateSchema,
} from 'lib/types/active-job'
import { WrappedApiErrorSchema } from 'lib/types/api-error'
import { AreaCreateSchema, AreaUpdateSchema } from 'lib/types/area'
import { Permission } from 'lib/types/auth'
import {
  CarCompleteSchema,
  CarCreateSchema,
  CarUpdateSchema,
} from 'lib/types/car'
import { LogsResponseSchema } from 'lib/types/log'
import { APILogEvent } from 'lib/types/logger'
import { MyPlanSchema } from 'lib/types/my-plan'
import { PlanCompleteSchema, PlanCreateSchema } from 'lib/types/plan'
import { PlannerSubmitSchema } from 'lib/types/planner'
import {
  ProposedJobCompleteSchema,
  ProposedJobCreateSchema,
  ProposedJobUpdateSchema,
} from 'lib/types/proposed-job'
import { RideCreateSchema, RideUpdateSchema } from 'lib/types/ride'
import {
  SummerJobEventCompleteSchema,
  SummerJobEventCreateSchema,
  SummerJobEventUpdateSchema,
} from 'lib/types/summerjob-event'
import { UserCompleteSchema, UserUpdateSchema } from 'lib/types/user'
import {
  WorkerCompleteSchema,
  WorkerCreateSchema,
  WorkerUpdateSchema,
  WorkersCreateSchema,
} from 'lib/types/worker'
import { z } from 'zod'
import { Allergy } from '../prisma/client'

const registry = new OpenAPIRegistry()

const _ApiErrorSchema = registry.register('ApiError', WrappedApiErrorSchema)
const _Permissions = registry.register('Permissions', z.nativeEnum(Permission))

//#region Allergies

const _AllergySchema = registry.register('Allergy', z.nativeEnum(Allergy))

registry.registerPath({
  path: '/api/allergies',
  method: 'get',
  description: 'Gets a list of supported allergies.',
  summary: 'List all supported allergies',
  tags: ['Allergies'],
  responses: {
    200: {
      description: 'List of supported allergies',
      content: {
        'application/json': {
          schema: z.array(_AllergySchema),
        },
      },
    },
  },
})

//#endregion

//#region Cars

const _CarCompleteSchema = registry.register('CarDetails', CarCompleteSchema)

registry.registerPath({
  path: '/api/cars',
  method: 'get',
  description:
    'Gets a list of available cars for the current event. Permissions required (at least one): ADMIN, CARS, PLANS.',
  summary: 'List all available cars',
  tags: ['Cars'],
  responses: {
    200: {
      description: 'List of available cars',
      content: {
        'application/json': {
          schema: z.array(_CarCompleteSchema),
        },
      },
    },
    409: {
      description: 'No active SummerJob event is set.',
    },
  },
})

const _CarSchema = registry.register('Car', CarSchema)
const _CarCreateSchema = registry.register('CarCreate', CarCreateSchema)

registry.registerPath({
  path: '/api/cars',
  method: 'post',
  description:
    'Creates a new car in the current event. The owner must be registered in the event. Permissions required (at least one): ADMIN, CARS, PLANS.',
  summary: 'Create a new car',
  tags: ['Cars'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: _CarCreateSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Car created successfully. Returns the created car.',
      content: {
        'application/json': {
          schema: _CarSchema,
        },
      },
    },
    409: {
      description: 'No active SummerJob event is set.',
    },
  },
})

registry.registerPath({
  path: '/api/cars/{id}',
  method: 'get',
  description:
    'Gets a car by ID. Permissions required (at least one): ADMIN, CARS, PLANS.',
  summary: 'Get a car by ID',
  tags: ['Cars'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'The ID of the car to get.',
      schema: {
        type: 'string',
      },
    },
  ],
  responses: {
    200: {
      description: 'Car found. Returns the car.',
      content: {
        'application/json': {
          schema: _CarCompleteSchema,
        },
      },
    },
    404: {
      description: 'Car not found.',
    },
  },
})

const _CarUpdateSchema = registry.register('CarUpdate', CarUpdateSchema)

registry.registerPath({
  path: '/api/cars/{id}',
  method: 'patch',
  description:
    'Updates a car. Permissions required (at least one): ADMIN, CARS, PLANS.',
  summary: 'Update a car',
  tags: ['Cars'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'The ID of the car to update.',
      schema: {
        type: 'string',
      },
    },
  ],
  request: {
    body: {
      content: {
        'application/json': {
          schema: _CarUpdateSchema,
        },
      },
    },
  },
  responses: {
    204: {
      description: 'Car updated successfully.',
    },
  },
})

registry.registerPath({
  path: '/api/cars/{id}',
  method: 'delete',
  description:
    'Deletes a car. Permissions required (at least one): ADMIN, CARS, PLANS.',
  summary: 'Delete a car',
  tags: ['Cars'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'The ID of the car to delete.',
      schema: {
        type: 'string',
      },
    },
  ],
  responses: {
    204: {
      description: 'Car deleted successfully.',
    },
  },
})

//#endregion

//#region Logs

const _LoggingSchema = registry.register('Log', LoggingSchema)
const _LogsResponseSchema = registry.register('LogsSummary', LogsResponseSchema)
const _LogEventType = registry.register(
  'LogEventType',
  z.nativeEnum(APILogEvent)
)

registry.registerPath({
  path: '/api/logs',
  method: 'get',
  description: 'Gets a list of logs. Permission required: ADMIN.',
  summary: 'List all logs',
  tags: ['Logs'],
  parameters: [
    {
      name: 'search',
      in: 'query',
      required: false,
      description: 'Search for a specific log entry.',
      schema: {
        type: 'string',
      },
    },
    {
      name: 'eventType',
      in: 'query',
      required: false,
      description: 'Filter by event type.',
      schema: {
        type: 'string',
        enum: Object.values(APILogEvent),
      },
    },
    {
      name: 'limit',
      in: 'query',
      required: false,
      description: 'Limit the number of returned logs (max 100).',
      schema: {
        type: 'number',
        maximum: 100,
      },
    },
    {
      name: 'offset',
      in: 'query',
      required: false,
      description:
        'Offset for the returned logs. Skips the first *n* logs and returns the next *limit* logs.',
      schema: {
        type: 'number',
      },
    },
  ],
  responses: {
    200: {
      description: 'List of logs',
      content: {
        'application/json': {
          schema: _LogsResponseSchema,
        },
      },
    },
  },
})

//#endregion

//#region My Plans

const _MyPlanSchema = registry.register('MyPlan', MyPlanSchema)

registry.registerPath({
  path: '/api/my-plans',
  method: 'get',
  description: "Gets the current user's plans. Permissions required: none.",
  summary: 'List my plans',
  tags: ['My Plans'],
  responses: {
    200: {
      description: "List of worker's plans",
      content: {
        'application/json': {
          schema: z.array(_MyPlanSchema),
        },
      },
    },
    409: {
      description: 'No active SummerJob event is set.',
    },
  },
})

//#endregion

//#region Planner

const _PlannerSubmitSchema = registry.register(
  'PlannerSubmitPlan',
  PlannerSubmitSchema
)

registry.registerPath({
  path: '/api/planner',
  method: 'post',
  description:
    'Submits a plan for automatic planning. Permissions required (at least one): ADMIN, PLANS.',
  summary: 'Submit a plan for automatic planning',
  tags: ['Planner'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: _PlannerSubmitSchema,
        },
      },
    },
  },
  responses: {
    204: {
      description: 'Plan submitted successfully.',
    },
  },
})

//#endregion

//#region Plans

const _PlanCompleteSchema = registry.register('PlanDetails', PlanCompleteSchema)

const _ActiveJobNoPlanSchema = registry.register(
  'ActiveJobNoPlan',
  ActiveJobNoPlanSchema
)

registry.registerPath({
  path: '/api/plans',
  method: 'get',
  description:
    'Gets a list of plans for the currently active event. Permissions required (at least one): ADMIN, PLANS.',
  summary: 'List all plans',
  tags: ['Plans'],
  responses: {
    200: {
      description: 'List of plans',
      content: {
        'application/json': {
          schema: z.array(_PlanCompleteSchema).openapi({ title: 'Plans' }),
        },
      },
    },
    409: {
      description: 'No active SummerJob event is set.',
    },
  },
})

const _PlanCreateSchema = registry.register('PlanCreate', PlanCreateSchema)
const _PlanSchema = registry.register('Plan', PlanSchema)

registry.registerPath({
  path: '/api/plans',
  method: 'post',
  description:
    'Creates a new plan for the currently active event. Permissions required (at least one): ADMIN, PLANS.',
  summary: 'Create a new plan',
  tags: ['Plans'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: _PlanCreateSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Plan created successfully.',
      content: {
        'application/json': {
          schema: _PlanSchema,
        },
      },
    },
    400: {
      description:
        'Invalid plan data. This is usually caused by one of the following: Invalid date supplied, Plan with this date already exists. Error message is specified.',
      content: {
        'application/json': {
          schema: _ApiErrorSchema,
        },
      },
    },
    409: {
      description: 'No active SummerJob event is set.',
    },
  },
})

registry.registerPath({
  path: '/api/plans/{planId}',
  method: 'get',
  description:
    'Gets a plan by ID. Permissions required (at least one): ADMIN, PLANS.',
  summary: 'Get a plan by ID',
  tags: ['Plans'],
  parameters: [
    {
      name: 'planId',
      in: 'path',
      required: true,
      description: 'ID of the plan to get.',
      schema: {
        type: 'string',
        format: 'uuid',
      },
    },
  ],
  responses: {
    200: {
      description: 'Plan',
      content: {
        'application/json': {
          schema: _PlanCompleteSchema,
        },
      },
    },
    404: {
      description: 'Plan not found.',
    },
  },
})

registry.registerPath({
  path: '/api/plans/{planId}',
  method: 'delete',
  description:
    'Deletes a plan by ID. Permissions required (at least one): ADMIN, PLANS.',
  summary: 'Delete a plan by ID',
  tags: ['Plans'],
  parameters: [
    {
      name: 'planId',
      in: 'path',
      required: true,
      description: 'ID of the plan to delete.',
      schema: {
        type: 'string',
        format: 'uuid',
      },
    },
  ],
  responses: {
    204: {
      description: 'Plan deleted successfully.',
    },
  },
})

const _ActiveJobSchema = registry.register('ActiveJob', ActiveJobSchema)
const _ActiveJobCreateSchema = registry.register(
  'ActiveJobCreate',
  ActiveJobCreateSchema.omit({ planId: true })
)
const _ActiveJobsCreateSchema = registry.register(
  'ActiveJobsCreate',
  ActiveJobCreateMultipleSchema.omit({ planId: true })
)

registry.registerPath({
  path: '/api/plans/{planId}/active-jobs',
  method: 'post',
  description:
    'Adds one or more jobs to the specified plan. Permissions required (at least one): ADMIN, PLANS.',
  summary: 'Add jobs to a plan',
  tags: ['Plans'],
  parameters: [
    {
      name: 'planId',
      in: 'path',
      required: true,
      description: 'ID of the plan to add the active job to.',
      schema: {
        type: 'string',
        format: 'uuid',
      },
    },
  ],
  request: {
    body: {
      content: {
        'application/json': {
          schema: _ActiveJobCreateSchema.or(_ActiveJobsCreateSchema),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Active job created successfully.',
      content: {
        'application/json': {
          schema: _ActiveJobSchema,
        },
      },
    },
    202: {
      description: 'Active jobs created successfully.',
    },
    400: {
      description:
        'Invalid active job data. This is usually caused by one of the following: Active job is already planned in this plan, Invalid *planId*. Error message is specified.',
      content: {
        'application/json': {
          schema: _ApiErrorSchema,
        },
      },
    },
  },
})

const _ActiveJobComplete = registry.register(
  'ActiveJobDetails',
  ActiveJobCompleteSchema
)

registry.registerPath({
  path: '/api/plans/{planId}/active-jobs/{activeJobId}',
  method: 'get',
  description:
    'Gets an active job by ID. Permissions required (at least one): ADMIN, PLANS.',
  summary: 'Get an active job by ID',
  tags: ['Plans'],
  parameters: [
    {
      name: 'planId',
      in: 'path',
      required: true,
      description: 'ID of the plan to get the active job from.',
      schema: {
        type: 'string',
        format: 'uuid',
      },
    },
    {
      name: 'activeJobId',
      in: 'path',
      required: true,
      description: 'ID of the active job to get.',
      schema: {
        type: 'string',
        format: 'uuid',
      },
    },
  ],
  responses: {
    200: {
      description: 'Active job',
      content: {
        'application/json': {
          schema: _ActiveJobComplete,
        },
      },
    },
    404: {
      description: 'Active job not found.',
    },
  },
})

const _ActiveJobUpdateSchema = registry.register(
  'ActiveJobUpdate',
  ActiveJobUpdateSchema
)

registry.registerPath({
  path: '/api/plans/{planId}/active-jobs/{activeJobId}',
  method: 'patch',
  description:
    'Updates an active job. Permissions required (at least one): ADMIN, PLANS.',
  summary: 'Update an active job',
  tags: ['Plans'],
  parameters: [
    {
      name: 'planId',
      in: 'path',
      required: true,
      description: 'ID of the plan to update the active job in.',
      schema: {
        type: 'string',
        format: 'uuid',
      },
    },
    {
      name: 'activeJobId',
      in: 'path',
      required: true,
      description: 'ID of the active job to update.',
      schema: {
        type: 'string',
        format: 'uuid',
      },
    },
  ],
  request: {
    body: {
      content: {
        'application/json': {
          schema: _ActiveJobUpdateSchema,
        },
      },
    },
  },
  responses: {
    204: {
      description: 'Active job updated successfully.',
    },
  },
})

registry.registerPath({
  path: '/api/plans/{planId}/active-jobs/{activeJobId}',
  method: 'delete',
  description:
    'Deletes an active job by ID. Permissions required (at least one): ADMIN, PLANS.',
  summary: 'Delete an active job by ID',
  tags: ['Plans'],
  parameters: [
    {
      name: 'planId',
      in: 'path',
      required: true,
      description: 'ID of the plan to delete the active job from.',
      schema: {
        type: 'string',
        format: 'uuid',
      },
    },
    {
      name: 'activeJobId',
      in: 'path',
      required: true,
      description: 'ID of the active job to delete.',
      schema: {
        type: 'string',
        format: 'uuid',
      },
    },
  ],
  responses: {
    204: {
      description: 'Active job deleted successfully.',
    },
  },
})

export const _RideCreate = registry.register('RideCreate', RideCreateSchema)
export const _RideSchema = registry.register('Ride', RideSchema)

registry.registerPath({
  path: '/api/plans/{planId}/active-jobs/{activeJobId}/rides',
  method: 'post',
  description:
    'Adds a ride to the specified active job. *driverId* should usually be the ID of the owner of the car. Permissions required (at least one): ADMIN, PLANS.',
  summary: 'Add a ride to an active job',
  tags: ['Plans'],
  parameters: [
    {
      name: 'planId',
      in: 'path',
      required: true,
      description: 'ID of the plan to add the rides to.',
      schema: {
        type: 'string',
        format: 'uuid',
      },
    },
    {
      name: 'activeJobId',
      in: 'path',
      required: true,
      description: 'ID of the active job to add the rides to.',
      schema: {
        type: 'string',
        format: 'uuid',
      },
    },
  ],
  request: {
    body: {
      content: {
        'application/json': {
          schema: _RideCreate,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Rides created successfully.',
      content: {
        'application/json': {
          schema: _RideSchema,
        },
      },
    },
  },
})

const _RideUpdateSchema = registry.register('RideUpdate', RideUpdateSchema)

registry.registerPath({
  path: '/api/plans/{planId}/active-jobs/{activeJobId}/rides/{rideId}',
  method: 'patch',
  description:
    'Updates a ride. Only passengers can be changed. If a passenger is added to this ride, they are automatically removed from all other rides in the same plan. If a new passenger is currently a driver for another ride, that ride is deleted. Permissions required (at least one): ADMIN, PLANS.',
  summary: 'Update a ride',
  tags: ['Plans'],
  parameters: [
    {
      name: 'planId',
      in: 'path',
      required: true,
      description: 'ID of the plan to update the ride in.',
      schema: {
        type: 'string',
        format: 'uuid',
      },
    },
    {
      name: 'activeJobId',
      in: 'path',
      required: true,
      description: 'ID of the active job to update the ride in.',
      schema: {
        type: 'string',
        format: 'uuid',
      },
    },
    {
      name: 'rideId',
      in: 'path',
      required: true,
      description: 'ID of the ride to update.',
      schema: {
        type: 'string',
        format: 'uuid',
      },
    },
  ],
  request: {
    body: {
      content: {
        'application/json': {
          schema: _RideUpdateSchema,
        },
      },
    },
  },
  responses: {
    204: {
      description: 'Ride updated successfully.',
    },
  },
})

registry.registerPath({
  path: '/api/plans/{planId}/active-jobs/{activeJobId}/rides/{rideId}',
  method: 'delete',
  description:
    'Deletes a ride by ID. Permissions required (at least one): ADMIN, PLANS.',
  summary: 'Delete a ride by ID',
  tags: ['Plans'],
  parameters: [
    {
      name: 'planId',
      in: 'path',
      required: true,
      description: 'ID of the plan to delete the ride from.',
      schema: {
        type: 'string',
        format: 'uuid',
      },
    },
    {
      name: 'activeJobId',
      in: 'path',
      required: true,
      description: 'ID of the active job to delete the ride from.',
      schema: {
        type: 'string',
        format: 'uuid',
      },
    },
    {
      name: 'rideId',
      in: 'path',
      required: true,
      description: 'ID of the ride to delete.',
      schema: {
        type: 'string',
        format: 'uuid',
      },
    },
  ],
  responses: {
    204: {
      description: 'Ride deleted successfully.',
    },
  },
})

//#endregion

//#region Proposed jobs

const _ProposedJobComplete = registry.register(
  'ProposedJobDetails',
  ProposedJobCompleteSchema
)

registry.registerPath({
  path: '/api/proposed-jobs',
  method: 'get',
  description:
    'Gets all proposed jobs in the currently active event. Permissions required (at least one): ADMIN, JOBS.',
  summary: 'Get all proposed jobs',
  tags: ['Proposed jobs'],
  parameters: [
    {
      name: 'assignableToPlan',
      in: 'query',
      required: false,
      description:
        'If ID of a plan is provided, only proposed jobs that can be assigned to a given plan are returned. Returned jobs are not planned in the given plan yet, are available that day, and are not completed nor hidden.',
      schema: {
        type: 'string',
        format: 'uuid',
      },
    },
  ],
  responses: {
    200: {
      description: 'Proposed jobs retrieved successfully.',
      content: {
        'application/json': {
          schema: z.array(_ProposedJobComplete),
        },
      },
    },
  },
})

const _ProposedJobCreateSchema = registry.register(
  'ProposedJobCreate',
  ProposedJobCreateSchema
)
const _ProposedJobSchema = registry.register('ProposedJob', ProposedJobSchema)

registry.registerPath({
  path: '/api/proposed-jobs',
  method: 'post',
  description:
    'Creates a new proposed job in the currently active event. Permissions required (at least one): ADMIN, JOBS.',
  summary: 'Create a new proposed job',
  tags: ['Proposed jobs'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: _ProposedJobCreateSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Proposed job created successfully.',
      content: {
        'application/json': {
          schema: _ProposedJobSchema,
        },
      },
    },
  },
})

registry.registerPath({
  path: '/api/proposed-jobs/{proposedJobId}',
  method: 'get',
  description:
    'Gets a proposed job by ID. Permissions required (at least one): ADMIN, JOBS.',
  summary: 'Get a proposed job by ID',
  tags: ['Proposed jobs'],
  parameters: [
    {
      name: 'proposedJobId',
      in: 'path',
      required: true,
      description: 'ID of the proposed job to retrieve.',
      schema: {
        type: 'string',
        format: 'uuid',
      },
    },
  ],
  responses: {
    200: {
      description: 'Proposed job retrieved successfully.',
      content: {
        'application/json': {
          schema: _ProposedJobComplete,
        },
      },
    },
  },
})

const _ProposedJobUpdateSchema = registry.register(
  'ProposedJobUpdate',
  ProposedJobUpdateSchema
)

registry.registerPath({
  path: '/api/proposed-jobs/{proposedJobId}',
  method: 'patch',
  description:
    'Updates a proposed job by ID. Permissions required (at least one): ADMIN, JOBS.',
  summary: 'Update a proposed job by ID',
  tags: ['Proposed jobs'],
  parameters: [
    {
      name: 'proposedJobId',
      in: 'path',
      required: true,
      description: 'ID of the proposed job to update.',
      schema: {
        type: 'string',
        format: 'uuid',
      },
    },
  ],
  request: {
    body: {
      content: {
        'application/json': {
          schema: _ProposedJobUpdateSchema,
        },
      },
    },
  },
  responses: {
    204: {
      description: 'Proposed job updated successfully.',
    },
  },
})

registry.registerPath({
  path: '/api/proposed-jobs/{proposedJobId}',
  method: 'delete',
  description:
    'Deletes a proposed job by ID. This should not be performed if a job has already been planned. Considering hiding it or marking it as completed instead. Permissions required (at least one): ADMIN, JOBS.',
  summary: 'Delete a proposed job by ID',
  tags: ['Proposed jobs'],
  parameters: [
    {
      name: 'proposedJobId',
      in: 'path',
      required: true,
      description: 'ID of the proposed job to delete.',
      schema: {
        type: 'string',
        format: 'uuid',
      },
    },
  ],
  responses: {
    204: {
      description: 'Proposed job deleted successfully.',
    },
  },
})

//#endregion

//#region SummerJob events

const _SummerJobEventCompleteSchema = registry.register(
  'SummerJobEventDetails',
  SummerJobEventCompleteSchema
)

registry.registerPath({
  path: '/api/summerjob-events',
  method: 'get',
  description:
    'Gets all SummerJob events. Permissions required (at least one): ADMIN.',
  summary: 'Get all SummerJob events',
  tags: ['SummerJob events'],
  responses: {
    200: {
      description: 'SummerJob events retrieved successfully.',
      content: {
        'application/json': {
          schema: z.array(_SummerJobEventCompleteSchema),
        },
      },
    },
  },
})

const _SummerJobEventCreateSchema = registry.register(
  'SummerJobEventCreate',
  SummerJobEventCreateSchema
)
const _SummerJobEventSchema = registry.register(
  'SummerJobEvent',
  SummerJobEventSchema
)

registry.registerPath({
  path: '/api/summerjob-events',
  method: 'post',
  description:
    'Creates a new SummerJob event. Permissions required (at least one): ADMIN.',
  summary: 'Create a new SummerJob event',
  tags: ['SummerJob events'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: _SummerJobEventCreateSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'SummerJob event created successfully.',
      content: {
        'application/json': {
          schema: _SummerJobEventSchema,
        },
      },
    },
  },
})

const _SummerJobEventUpdateSchema = registry.register(
  'SummerJobEventUpdate',
  SummerJobEventUpdateSchema
)

registry.registerPath({
  path: '/api/summerjob-events/{summerJobEventId}',
  method: 'patch',
  description:
    'Updates a SummerJob event by ID. Changing one event to active automatically changes all other events to inactive and locks accounts of all non-admin users. Do not set events as inactive - instead, set another one as active. Permissions required (at least one): ADMIN.',
  summary: 'Update a SummerJob event by ID',
  tags: ['SummerJob events'],
  parameters: [
    {
      name: 'summerJobEventId',
      in: 'path',
      required: true,
      description: 'ID of the SummerJob event to update.',
      schema: {
        type: 'string',
        format: 'uuid',
      },
    },
  ],
  request: {
    body: {
      content: {
        'application/json': {
          schema: _SummerJobEventUpdateSchema,
        },
      },
    },
  },
  responses: {
    204: {
      description: 'SummerJob event updated successfully.',
    },
  },
})

registry.registerPath({
  path: '/api/summerjob-events/{summerJobEventId}',
  method: 'delete',
  description:
    'Deletes a SummerJob event by ID. Permissions required (at least one): ADMIN.',
  summary: 'Delete a SummerJob event by ID',
  tags: ['SummerJob events'],
  parameters: [
    {
      name: 'summerJobEventId',
      in: 'path',
      required: true,
      description: 'ID of the SummerJob event to delete.',
      schema: {
        type: 'string',
        format: 'uuid',
      },
    },
  ],
  responses: {
    204: {
      description: 'SummerJob event deleted successfully.',
    },
  },
})

//#endregion

//#region Areas

const _AreaSchema = registry.register('Area', AreaSchema)

registry.registerPath({
  path: '/api/summerjob-events/{summerJobEventId}/areas',
  method: 'get',
  description:
    'Gets all areas for a SummerJob event. Permissions required (at least one): ADMIN, JOBS.',
  summary: 'Get all areas for a SummerJob event',
  tags: ['Areas'],
  parameters: [
    {
      name: 'summerJobEventId',
      in: 'path',
      required: true,
      description: 'ID of the SummerJob event to get areas for.',
      schema: {
        type: 'string',
        format: 'uuid',
      },
    },
  ],
  responses: {
    200: {
      description: 'Areas retrieved successfully.',
      content: {
        'application/json': {
          schema: z.array(_AreaSchema),
        },
      },
    },
  },
})

const _AreaCreateSchema = registry.register(
  'AreaCreate',
  AreaCreateSchema.omit({ summerJobEventId: true })
)

registry.registerPath({
  path: '/api/summerjob-events/{summerJobEventId}/areas',
  method: 'post',
  description:
    'Creates a new area for a SummerJob event. Permissions required (at least one): ADMIN.',
  summary: 'Create a new area for a SummerJob event',
  tags: ['Areas'],
  parameters: [
    {
      name: 'summerJobEventId',
      in: 'path',
      required: true,
      description: 'ID of the SummerJob event to create an area for.',
      schema: {
        type: 'string',
        format: 'uuid',
      },
    },
  ],
  request: {
    body: {
      content: {
        'application/json': {
          schema: _AreaCreateSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Area created successfully.',
      content: {
        'application/json': {
          schema: _AreaSchema,
        },
      },
    },
  },
})

const _AreaUpdateSchema = registry.register('AreaUpdate', AreaUpdateSchema)

registry.registerPath({
  path: '/api/summerjob-events/{summerJobEventId}/areas/{areaId}',
  method: 'patch',
  description:
    'Updates an area for a SummerJob event by ID. Permissions required (at least one): ADMIN.',
  summary: 'Update an area for a SummerJob event by ID',
  tags: ['Areas'],
  parameters: [
    {
      name: 'summerJobEventId',
      in: 'path',
      required: true,
      description: 'ID of the SummerJob event to update an area for.',
      schema: {
        type: 'string',
        format: 'uuid',
      },
    },
    {
      name: 'areaId',
      in: 'path',
      required: true,
      description: 'ID of the area to update.',
      schema: {
        type: 'string',
        format: 'uuid',
      },
    },
  ],
  request: {
    body: {
      content: {
        'application/json': {
          schema: _AreaUpdateSchema,
        },
      },
    },
  },
  responses: {
    204: {
      description: 'Area updated successfully.',
    },
  },
})

registry.registerPath({
  path: '/api/summerjob-events/{summerJobEventId}/areas/{areaId}',
  method: 'delete',
  description:
    'Deletes an area for a SummerJob event by ID. Permissions required (at least one): ADMIN.',
  summary: 'Delete an area for a SummerJob event by ID',
  tags: ['Areas'],
  parameters: [
    {
      name: 'summerJobEventId',
      in: 'path',
      required: true,
      description: 'ID of the SummerJob event to delete an area for.',
      schema: {
        type: 'string',
        format: 'uuid',
      },
    },
    {
      name: 'areaId',
      in: 'path',
      required: true,
      description: 'ID of the area to delete.',
      schema: {
        type: 'string',
        format: 'uuid',
      },
    },
  ],
  responses: {
    204: {
      description: 'Area deleted successfully.',
    },
  },
})

//#endregion

//#region Users

const _UserCompleteSchema = registry.register('UserDetails', UserCompleteSchema)

registry.registerPath({
  path: '/api/users',
  method: 'get',
  description:
    'Gets all users registered in the currently active event. Add new workers to the event and they will automatically appear as users here. Permissions required (at least one): ADMIN.',
  summary: 'Get all users',
  tags: ['Users'],
  responses: {
    200: {
      description: 'Users retrieved successfully.',
      content: {
        'application/json': {
          schema: z.array(_UserCompleteSchema),
        },
      },
    },
  },
})

const _UserUpdateSchema = registry.register('UserUpdate', UserUpdateSchema)

registry.registerPath({
  path: '/api/users/{userId}',
  method: 'patch',
  description:
    'Updates a user by ID. Blocked users are signed out and cannot sign in (except for Admins). Users can be unblocked to revert this. Permissions required (at least one): ADMIN.',
  summary: 'Update a user by ID',
  tags: ['Users'],
  parameters: [
    {
      name: 'userId',
      in: 'path',
      required: true,
      description: 'ID of the user to update.',
      schema: {
        type: 'string',
        format: 'uuid',
      },
    },
  ],
  request: {
    body: {
      content: {
        'application/json': {
          schema: _UserUpdateSchema,
        },
      },
    },
  },
  responses: {
    204: {
      description: 'User updated successfully.',
    },
  },
})

//#endregion

//#region Workers

const _WorkerCompleteSchema = registry.register(
  'WorkerDetails',
  WorkerCompleteSchema
)

registry.registerPath({
  path: '/api/workers',
  method: 'get',
  description:
    'Gets all workers registered in the currently active event. Permissions required (at least one): ADMIN, WORKERS, PLANS.',
  summary: 'Get all workers',
  tags: ['Workers'],
  parameters: [
    {
      name: 'withoutJobInPlan',
      in: 'query',
      required: false,
      schema: {
        type: 'string',
        format: 'uuid',
      },
      description:
        'If plan ID is provided, only workers without a job in the given plan will be returned. This includes workers that are NOT available that day.',
    },
  ],
  responses: {
    200: {
      description: 'Workers retrieved successfully.',
      content: {
        'application/json': {
          schema: z.array(_WorkerCompleteSchema),
        },
      },
    },
  },
})

const _WorkerCreateSchema = registry.register(
  'WorkerCreate',
  WorkerCreateSchema
)
const _WorkersCreateSchema = registry.register(
  'WorkersCreate',
  WorkersCreateSchema
)
const _WorkerSchema = registry.register('Worker', WorkerSchema)

registry.registerPath({
  path: '/api/workers',
  method: 'post',
  description:
    'Creates a new worker in the currently active event. If a worker with the same e-mail address is already registered in previous events, the worker will be automatically added to the current event. The worker will be able to sign in immediately. Permissions required (at least one): ADMIN, WORKERS, PLANS.',
  summary: 'Create one or multiple new workers',
  tags: ['Workers'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: _WorkerCreateSchema.or(_WorkersCreateSchema),
        },
      },
    },
  },
  responses: {
    201: {
      description:
        'Worker(s) created successfully. Returns the created worker(s).',
      content: {
        'application/json': {
          schema: _WorkerSchema.or(z.array(_WorkerSchema)),
        },
      },
    },
    409: {
      description: 'No active SummerJob event is set.',
    },
  },
})

registry.registerPath({
  path: '/api/workers/{workerId}',
  method: 'get',
  description:
    'Gets a worker by ID. Permissions required (at least one): ADMIN, WORKERS, or being logged in as the requested worker.',
  summary: 'Get a worker by ID',
  tags: ['Workers'],
  parameters: [
    {
      name: 'workerId',
      in: 'path',
      required: true,
      description: 'ID of the worker to get.',
      schema: {
        type: 'string',
        format: 'uuid',
      },
    },
  ],
  responses: {
    200: {
      description: 'Worker retrieved successfully.',
      content: {
        'application/json': {
          schema: _WorkerCompleteSchema,
        },
      },
    },
  },
})

const _WorkerUpdateSchema = registry.register(
  'WorkerUpdate',
  WorkerUpdateSchema
)

registry.registerPath({
  path: '/api/workers/{workerId}',
  method: 'patch',
  description:
    'Updates a worker by ID. Permissions required (at least one): ADMIN, WORKERS, or being logged in as the requested worker.',
  summary: 'Update a worker by ID',
  tags: ['Workers'],
  parameters: [
    {
      name: 'workerId',
      in: 'path',
      required: true,
      description: 'ID of the worker to update.',
      schema: {
        type: 'string',
        format: 'uuid',
      },
    },
  ],
  request: {
    body: {
      content: {
        'application/json': {
          schema: _WorkerUpdateSchema,
        },
      },
    },
  },
  responses: {
    204: {
      description: 'Worker updated successfully.',
    },
  },
})

registry.registerPath({
  path: '/api/workers/{workerId}',
  method: 'delete',
  description:
    "Deletes a worker by ID. Worker's cars are also deleted. If the worker participated in any active job, they are anonymized instead to maintain history integrity. Permissions required (at least one): ADMIN, WORKERS.",
  summary: 'Delete a worker by ID',
  tags: ['Workers'],
  parameters: [
    {
      name: 'workerId',
      in: 'path',
      required: true,
      description: 'ID of the worker to delete.',
      schema: {
        type: 'string',
        format: 'uuid',
      },
    },
  ],
  responses: {
    204: {
      description: 'Worker deleted successfully.',
    },
  },
})

registry.registerPath({
  path: '/api/workers/{workerId}/photo',
  method: 'get',
  description:
    'Gets a worker\'s photo by worker\'s ID. Permissions required (at least one): ADMIN, WORKERS.',
  summary: 'Get a worker\'s photo by ID',
  tags: ['Workers'],
  parameters: [
    {
      name: 'workerId',
      in: 'path',
      required: true,
      description: 'ID of the worker to get.',
      schema: {
        type: 'string',
        format: 'uuid',
      },
    },
  ],
  responses: {
    200: {
      description: 'Worker\'s photo retrieved successfully.',
      content: {
        'image/*': {
          schema: {
            type: 'string',
            format: 'binary',
          },
        }
      },
    },
  },
})


//#endregion

const generator = new OpenAPIGenerator(registry.definitions, '3.0.0')
let openApiDocument = {}
try {
  openApiDocument = generator.generateDocument({
    info: {
      title: 'SummerJob API',
      version: '1.0',
      description:
        'All endpoints require session cookies to be set. Before you start trying the commands below, you must sign into the SummerJob website to obtain session cookie. Schema available at */api/swagger.json* . When sending dates to any of the following endpoints, use ISO 8601 format with UTC timezone (e.g. 2021-07-01T00:00:00.000Z).',
    },
  })
} catch (err) {
  console.log('Nastala chyba při generování dokumentu OpenAPI')
  console.error(err)
}

export default openApiDocument
