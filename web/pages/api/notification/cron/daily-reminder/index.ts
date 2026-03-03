import { APIMethodHandler } from 'lib/api/MethodHandler'
import { sendDailyReminderNotification } from 'lib/notifications/notifications'
import { NextApiRequest, NextApiResponse } from 'next'

async function post(req: NextApiRequest, res: NextApiResponse) {
  // Check auth
  const secret = process.env.CRON_SECRET
  const auth = req.headers.authorization
  if (!secret || auth !== `Bearer ${secret}`) {
    res.status(401).end()
    return
  }

  try {
    await sendDailyReminderNotification()
    res.status(200).end()
  } catch (e: unknown) {
    console.error('Unexpected error in daily notification: ', e)
    res.status(500).end()
  }
}

export default APIMethodHandler({ post })
