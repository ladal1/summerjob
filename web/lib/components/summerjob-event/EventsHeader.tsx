'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import PageHeader from '../page-header/PageHeader'
import NewEventModal from './NewEventModal'

export default function EventsHeader() {
  const router = useRouter()
  const onSuccess = () => {
    setIsNewEventModalOpen(false)
    router.refresh()
  }
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false)
  return (
    <PageHeader title={'Ročníky'} isFluid={false}>
      <button
        className="btn btn-primary btn-with-icon"
        onClick={() => setIsNewEventModalOpen(true)}
      >
        <i className="far fa-plus"></i>
        Nový ročník
      </button>
      {isNewEventModalOpen && (
        <NewEventModal
          onConfirm={onSuccess}
          onReject={() => setIsNewEventModalOpen(false)}
        />
      )}
    </PageHeader>
  )
}
