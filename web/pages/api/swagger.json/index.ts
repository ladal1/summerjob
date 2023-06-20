import openApiDocument from 'lib/api/openapi'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function get(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.NODE_ENV !== 'development') {
    res.status(404).end()
    return
  }
  if (req.method !== 'GET') {
    res.status(405).end()
    return
  }
  res.status(200).json(openApiDocument)
}
