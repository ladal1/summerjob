import {
  ApiBadRequestError,
  ApiDbError,
  ApiInternalServerError,
} from 'lib/types/api-error'
import { InternalError, InvalidDataError } from 'lib/data/internal-error'
import logger from 'lib/logger/logger'
import { Prisma } from 'lib/prisma/client'
import { APIMethod } from 'lib/types/api'
import { ExtendedSession } from 'lib/types/auth'
import { NextApiRequest, NextApiResponse } from 'next'

interface MethodHandlerProps {
  get?: APIMethod
  post?: APIMethod
  del?: APIMethod
  patch?: APIMethod
}

export function APIMethodHandler({
  get,
  post,
  patch,
  del,
}: MethodHandlerProps) {
  return async function (
    req: NextApiRequest,
    res: NextApiResponse,
    session: ExtendedSession
  ) {
    switch (req.method) {
      case 'GET':
        if (get) {
          await handle(get, req, res, session)
          return
        }
        break
      case 'POST':
        if (post) {
          await handle(post, req, res, session)
          return
        }
        break
      case 'PATCH':
        if (patch) {
          await handle(patch, req, res, session)
          return
        }
        break
      case 'DELETE':
        if (del) {
          await handle(del, req, res, session)
          return
        }
        break
      default:
        res.status(405).end()
        break
    }
    res.status(405).end()
  }
}

async function handle(
  func: APIMethod,
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  try {
    await func(req, res, session)
  } catch (error) {
    if (error instanceof Prisma.PrismaClientInitializationError) {
      res.status(500).json({
        error: new ApiDbError(),
      })
      return
    } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
      res.status(400).json({
        error: new ApiBadRequestError(),
      })
      return
    } else if (error instanceof Prisma.PrismaClientValidationError) {
      res.status(400).json({
        error: new ApiBadRequestError(),
      })
      return
    } else if (error instanceof InvalidDataError) {
      res.status(400).json({
        error: new ApiBadRequestError(error.reason),
      })
      return
    } else if (error instanceof InternalError) {
      // These are internally thrown errors, usually because no active summerjob event is set
      // or the user is not registered in the event. The user is informed about these issues through the web interface.
      // Therefore, these errors should not be logged in production.
      if (process.env.NODE_ENV === 'development') {
        logger.error(error)
      }
      res.status(500).json({
        error: new ApiInternalServerError(error.reason),
      })
      return
    }
    logger.error(error)
    res.status(500).json({
      error: new ApiInternalServerError(),
    })
  }
}
