import { CronJob } from 'cron'
import { loadEnvFile } from 'node:process'

loadEnvFile()

// Load env first, then notifications so that webpush.setVapidDetails() runs after env is loaded
const { sendAdorationReminderNotification, sendDailyReminderNotification } =
  await import('lib/notifications/notifications')

// Daily notification
new CronJob(
  '0 20 * * *', // Every day at 20:00
  async function () {
    try {
      await sendDailyReminderNotification()
      console.log('[cron] Daily notification sent successfully')
    } catch (e) {
      console.error('[cron] Unexpected error in daily notification: ', e)
    }
  },
  null,
  true,
  'Europe/Prague'
)

// Adoration reminder notification
new CronJob(
  '*/10 * * * *', // Every 10 minutes
  async function () {
    try {
      await sendAdorationReminderNotification()
      console.log('[cron] Adoration notification sent successfully')
    } catch (e) {
      console.error('[cron] Unexpected error in adoration notification: ', e)
    }
  },
  null,
  true,
  'Europe/Prague'
)
