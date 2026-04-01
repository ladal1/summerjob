import { getSMJSession, getWorkerIdFromSession } from 'lib/auth/auth'
import AccessDeniedPage from 'lib/components/error-page/AccessDeniedPage'
import NotificationsClientPage from 'lib/components/notifications/NotificationsClientPage'
import { getWorkersNotifications } from 'lib/data/notification'

export default async function UserNotificationPage() {
  const session = await getSMJSession()
  const workerId = await getWorkerIdFromSession(session)

  if (!session || !workerId) {
    return <AccessDeniedPage />
  }

  const notifications = await getWorkersNotifications(workerId)

  return <NotificationsClientPage notifications={notifications} />
}
