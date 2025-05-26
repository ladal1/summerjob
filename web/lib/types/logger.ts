import { Logging } from 'lib/prisma/client'
import { Serialized } from './serialize'

export enum APILogEvent {
  WORKER_CREATE = 'WORKER_CREATE',
  WORKER_MODIFY = 'WORKER_MODIFY',
  WORKER_DELETE = 'WORKER_DELETE',
  PLAN_CREATE = 'PLAN_CREATE',
  PLAN_MODIFY = 'PLAN_MODIFY',
  PLAN_DELETE = 'PLAN_DELETE',
  PLAN_PLANNER_START = 'PLAN_PLANNER_START',
  PLAN_JOB_ADD = 'PLAN_JOB_ADD',
  PLAN_JOBS_ADD = 'PLAN_JOBS_ADD',
  PLAN_JOB_DELETE = 'PLAN_JOB_REMOVE',
  PLAN_JOB_MODIFY = 'PLAN_JOB_MODIFY',
  PLAN_RIDE_ADD = 'PLAN_RIDE_ADD',
  PLAN_RIDE_DELETE = 'PLAN_RIDE_DELETE',
  PLAN_RIDE_MODIFY = 'PLAN_RIDE_MODIFY',
  PLAN_UPDATE = 'PLAN_PUBLISH',
  JOB_CREATE = 'JOB_CREATE',
  JOB_MODIFY = 'JOB_MODIFY',
  JOB_DELETE = 'JOB_DELETE',
  CAR_CREATE = 'CAR_CREATE',
  CAR_MODIFY = 'CAR_MODIFY',
  CAR_DELETE = 'CAR_DELETE',
  SMJEVENT_CREATE = 'SMJEVENT_CREATE',
  SMJEVENT_MODIFY = 'SMJEVENT_MODIFY',
  SMJEVENT_DELETE = 'SMJEVENT_DELETE',
  SMJEVENT_APPLICATION_TOGGLE = 'SMJEVENT_APPLICATION_TOGGLE',
  SMJEVENT_PASSWORD_PROTECTION_TOGGLE = 'SMJEVENT_PASSWORD_PROTECTION_TOGGLE',
  AREA_CREATE = 'AREA_CREATE',
  AREA_MODIFY = 'AREA_MODIFY',
  AREA_DELETE = 'AREA_DELETE',
  USER_MODIFY = 'USER_MODIFY',
  TOOL_CREATE = 'TOOL_CREATE',
  TOOL_UPDATE = 'TOOL_UPDATE',
  TOOL_DELETE = 'TOOL_DELETE',
  PHOTO_CREATE = 'PHOTO_CREATE',
  PHOTO_UPDATE = 'PHOTO_UPDATE',
  PHOTO_DELETE = 'PHOTO_DELETE',
  POST_CREATE = 'POST_CREATE',
  POST_MODIFY = 'POST_MODIFY',
  POST_DELETE = 'POST_DELETE',
  APPLICATION_CREATE = 'APPLICATION_CREATE',
  APPLICATION_MODIFY = 'APPLICATION_MODIFY',
  APPLICATION_DELETE = 'APPLICATION_DELETE',
}

export type FilteredLogs = {
  logs: Logging[]
  total: number
}

export function serializeLogs(logs: FilteredLogs): Serialized {
  return {
    data: JSON.stringify(logs),
  }
}

export function deserializeLogs(serialized: Serialized): FilteredLogs {
  const data = JSON.parse(serialized.data) as FilteredLogs
  return deserializeLogsTime(data)
}

export function deserializeLogsTime(logs: FilteredLogs) {
  const withTime = logs.logs.map(log => ({
    ...log,
    timestamp: new Date(log.timestamp),
  }))
  return { logs: withTime, total: logs.total }
}
