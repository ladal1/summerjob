'use client'
import { useAPICarCreate } from 'lib/fetcher/car'
import type { CarCreateData } from 'lib/types/car'
import { WorkerBasicInfo } from 'lib/types/worker'
import { useState } from 'react'
import ErrorMessageModal from '../modal/ErrorMessageModal'
import SuccessProceedModal from '../modal/SuccessProceedModal'
import CarCreateForm from './CarCreateForm'
import { useRouter } from 'next/navigation'

export default function CreateCar({ workers }: { workers: WorkerBasicInfo[] }) {
  const [saved, setSaved] = useState(false)
  const { trigger, isMutating, error, reset } = useAPICarCreate({
    onSuccess: () => {
      setSaved(true)
    },
  })

  const router = useRouter()

  const onSubmit = (data: CarCreateData) => {
    trigger(data)
  }
  
  const onConfirmationClosed = () => {
    setSaved(false)
    router.back()
  }

  return (
    <>
      <CarCreateForm
        onSubmit={onSubmit}
        isSending={isMutating}
        owners={workers}
      />
      {saved && <SuccessProceedModal onClose={onConfirmationClosed} />}
      {error && <ErrorMessageModal onClose={reset} />}
    </>
  )
}
