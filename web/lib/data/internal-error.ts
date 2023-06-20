enum InternalErrorType {
  INVALID_DATA = 'INVALID_DATA',
  NO_ACTIVE_EVENT = 'NO_ACTIVE_EVENT',
  WORKER_NOT_REGISTERED_IN_EVENT = 'WORKER_NOT_REGISTERED_IN_EVENT',
  WORKER_REGISTERED_IN_EVENT = 'WORKER_REGISTERED_IN_EVENT',
}

export class InternalError extends Error {
  readonly type: InternalErrorType
  readonly reason: string
  constructor(reason: string, errorType: InternalErrorType) {
    super(reason)
    this.reason = reason
    this.type = errorType
  }
}

export class InvalidDataError extends InternalError {
  constructor(message?: string) {
    super(message ?? 'Invalid data.', InternalErrorType.INVALID_DATA)
  }
}

export class NoActiveEventError extends InternalError {
  constructor() {
    super(
      'No active SummerJob event is set.',
      InternalErrorType.NO_ACTIVE_EVENT
    )
  }
}

export class WorkerNotRegisteredInEventError extends InternalError {
  constructor() {
    super(
      'Worker is not registered in the active SummerJob event.',
      InternalErrorType.WORKER_NOT_REGISTERED_IN_EVENT
    )
  }
}

export class WorkerAlreadyExistsError extends InternalError {
  constructor(message?: string) {
    super(
      `Worker already exists in the active SummerJob event: ${message}`,
      InternalErrorType.WORKER_REGISTERED_IN_EVENT
    )
  }
}
