import { ApiBadRequestError, ApiNoActiveEventError } from 'lib/types/api-error'
import { cache_getActiveSummerJobEvent } from 'lib/data/cache'
import { SummerJobEvent } from 'lib/prisma/zod'
import { NextApiResponse } from 'next'
import { z } from 'zod'

export function validateOrSendError<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
  res: NextApiResponse
): z.infer<T> | undefined {
  const parsed = schema.safeParse(data)
  if (!parsed.success) {
    /* parsed.error.issues.map(issue => {
      console.log(issue.code)
      console.log(issue.message)
    }) */
    res.status(400).json({
      error: new ApiBadRequestError(
        'Incorrect input values.',
        parsed.error.issues.map(issue => ({
          code: issue.code,
          message: issue.message,
        }))
      ),
    })
    return undefined
  }
  return parsed.data
}

export async function getActiveEventOrSendError(
  res: NextApiResponse
): Promise<SummerJobEvent | undefined> {
  const activeEvent = await cache_getActiveSummerJobEvent()
  if (activeEvent === undefined) {
    res.status(409).json({
      error: new ApiNoActiveEventError(),
    })
    return undefined
  }
  return activeEvent
}
