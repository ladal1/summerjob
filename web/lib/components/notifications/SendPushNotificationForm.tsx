'use client'

import { useState } from 'react'
import { Label } from '../forms/Label'
import ConfirmationModal from '../modal/ConfirmationModal'
import { FilterSelectInput } from '../forms/input/FilterSelectInput'
import type { NotificationTarget } from 'lib/types/notification'

interface Props {
  availableDates: Date[]
  availableJobs: { jobId: string; jobName: string }[]
  availablePosts: { postId: string; postName: string }[]
}

export default function SendPushNotificationForm({
  availableDates,
  availableJobs,
  availablePosts,
}: Props) {
  const [value, setValue] = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')

  // Open confirm modal on form submit
  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setShowConfirmModal(true)
  }

  // Handle modal confirmation
  const handleConfirm = async () => {
    setLoading(true)
    setError(false)
    setStatusMessage('')
    setShowConfirmModal(false)

    try {
      const res = await fetch('/api/push-subscription/multicast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: value }),
      })

      if (!res.ok) {
        throw new Error()
      }
      setStatusMessage('Oznámení úspěšně odesláno')
      setValue('')
    } catch {
      setError(true)
      setStatusMessage('Nepodařilo se odeslat oznámení')
    } finally {
      setLoading(false)
      console.log(notificationTarget)
    }
  }

  // Handle notification target selection
  const handleSelectTarget = (val: string) => {
    switch (val) {
      case 'everyone':
        setNotificationTarget({ type: 'everyone' })
        break
      case 'working-on-day':
        setNotificationTarget({
          type: 'working-on-day',
          date: availableDates[0],
        })
        break
      case 'working-on-job':
        setNotificationTarget({ type: 'working-on-job', jobId: '' })
        break
      case 'signed-up-for-event':
        setNotificationTarget({ type: 'signed-up-for-post', postId: '' })
        break
      case 'food-allergies':
        setNotificationTarget({ type: 'food-allergies' })
        break
    }
  }

  // Options for notification target selection
  const notificationTargetSelectItems = [
    {
      id: 'everyone',
      name: 'Všichni',
      searchable: 'Všichni',
    },
    {
      id: 'working-on-day',
      name: 'Pracující v daný den',
      searchable: 'Pracující v daný den',
    },
    {
      id: 'working-on-job',
      name: 'Pracující na daném jobu',
      searchable: 'Pracující na daném jobu',
    },
    {
      id: 'signed-up-for-post',
      name: 'Zapsaní na danou událost',
      searchable: 'Zapsaní na danou událost',
    },
    {
      id: 'food-allergies',
      name: 'Alergici na jídlo',
      searchable: 'Alergici na jídlo',
    },
  ]
  const [notificationTarget, setNotificationTarget] =
    useState<NotificationTarget | null>(null)

  return (
    <form onSubmit={handleSubmit}>
      <FilterSelectInput
        id="notification-target"
        label="Skupina příjemců"
        placeholder={'Vyberte skupinu příjemců'}
        items={notificationTargetSelectItems}
        onSelected={handleSelectTarget}
        errors={{}}
      />

      <Label id="notification-multicast-input" label="Text notifikace"></Label>
      <div className="d-flex flex-row gap-3">
        <input
          id="notification-multicast-input"
          type="text"
          className="form-control pb-0 fs-5"
          placeholder="Zadejte text hromadné notifikace..."
          autoComplete="off"
          value={value}
          onChange={e => setValue(e.target.value)}
        />

        <button
          type="submit"
          className="btn btn-primary text-nowrap"
          disabled={
            value.trim() === '' || loading || notificationTarget === null
          }
        >
          {loading ? 'Posílání...' : 'Poslat oznámení'}
        </button>
      </div>

      <div className="d-flex justify-content-between align-items-center mt-2">
        <div style={{ minHeight: '1.25rem' }}>
          {statusMessage && (
            <span className={error ? 'text-danger' : 'text-success'}>
              {statusMessage}
            </span>
          )}
        </div>
      </div>

      {showConfirmModal && (
        <ConfirmationModal
          onConfirm={handleConfirm}
          onReject={() => setShowConfirmModal(false)}
        >
          Chystáte se odeslat oznámení všem účastníkům akce.
        </ConfirmationModal>
      )}
    </form>
  )
}
