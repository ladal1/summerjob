'use client'

import { formatInTimeZone } from 'date-fns-tz'
import { useAPINotificationUpdate } from 'lib/fetcher/notification'
import { FrontendNotificationData } from 'lib/types/notification'
import { useState } from 'react'

interface Props {
  notification: FrontendNotificationData
}

export default function UserNotification({ notification }: Props) {
  const [seen, setSeen] = useState(notification.seen)

  const { trigger, isMutating } = useAPINotificationUpdate(notification.id, {
    onSuccess: () => {
      setSeen(true)
    },
  })

  const handleMarkAsSeen = () => {
    if (isMutating || seen) return
    trigger({})
  }

  return (
    <div
      className={`rounded border shadow-sm p-3 d-flex justify-content-between gap-3 ${
        seen ? 'bg-white' : 'border-warning bg-warning bg-opacity-10'
      }`}
      style={{ minHeight: 100 }}
    >
      <div className="flex-grow-1">
        {!seen && (
          <>
            <span className="mb-1 badge bg-warning">Nové</span>
          </>
        )}

        <p>{notification.text}</p>
      </div>

      <div className="d-flex flex-column align-items-end text-end flex-shrink-0">
        <div className="small text-muted">
          {formatInTimeZone(
            notification.receivedAt,
            'Europe/Prague',
            'd. M. HH:mm'
          )}
        </div>

        {!seen && (
          <button
            type="button"
            className="btn btn-sm mt-2"
            onClick={handleMarkAsSeen}
            disabled={isMutating}
            title="Označit jako přečtené"
          >
            <i className="fas fa-check" />
          </button>
        )}
      </div>
    </div>
  )
}
