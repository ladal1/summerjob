'use client'

import PageHeader from 'lib/components/page-header/PageHeader'
import UserNotification from './UserNotification'
import { FrontentNotificationData } from 'lib/types/notification'

interface Props {
  notifications: FrontentNotificationData[]
}

export default function UserNotificationPage({ notifications }: Props) {
  return (
    <>
      <PageHeader title="Oznámení" isFluid={false} />

      <div className="container pb-3">
        {notifications.length > 0 ? (
          <ol className="list-unstyled d-flex flex-column gap-2">
            {notifications.map(notification => (
              <li key={notification.id}>
                <UserNotification notification={notification} />
              </li>
            ))}
          </ol>
        ) : (
          <span>Nemáte žádná oznámení</span>
        )}
      </div>
    </>
  )
}
