import { z } from 'zod'

export enum ApiErrorType {
  GENERIC_ERROR = 'GENERIC_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  DB_CONNECT_ERROR = 'DB_CONNECT_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
}

export type WrappedError<T extends Error> = {
  error: T
}

const ApiErrorReasonsSchema = z.array(
  z.object({
    code: z.string(),
    message: z.string(),
  })
)

type ApiErrorReasons = z.infer<typeof ApiErrorReasonsSchema>

export const ApiErrorSchema = z.object({
  type: z.nativeEnum(ApiErrorType),
  reason: z.string(),
  issues: ApiErrorReasonsSchema.optional(),
})

export const WrappedApiErrorSchema = z.object({
  error: ApiErrorSchema,
})

export class ApiError extends Error {
  readonly type: ApiErrorType
  readonly reason: string
  readonly issues?: ApiErrorReasons
  constructor(
    reason: string,
    errorType: ApiErrorType,
    issues?: ApiErrorReasons
  ) {
    super(reason)
    this.reason = reason
    this.type = errorType
    this.issues = issues
  }
}

export class ApiDbError extends ApiError {
  constructor() {
    super('Could not connect to database.', ApiErrorType.DB_CONNECT_ERROR)
  }
}

export class ApiBadRequestError extends ApiError {
  constructor(message?: string, issues?: ApiErrorReasons) {
    super(message ?? 'Invalid input.', ApiErrorType.BAD_REQUEST, issues)
  }
}

export class ApiInternalServerError extends ApiError {
  constructor(message?: string) {
    super(
      message ?? 'An internal server error occurred.',
      ApiErrorType.INTERNAL_SERVER_ERROR
    )
  }
}

export class ApiNoActiveEventError extends ApiError {
  constructor() {
    super(
      'No active SummerJob event is set.',
      ApiErrorType.INTERNAL_SERVER_ERROR
    )
  }
}
