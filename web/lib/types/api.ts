import { NextApiRequest, NextApiResponse } from 'next'
import { ExtendedSession } from './auth'

export type APIMethod = (
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) => Promise<void>
