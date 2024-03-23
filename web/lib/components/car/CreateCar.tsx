'use client'
import { useAPICarCreate } from 'lib/fetcher/car'
import type { CarCreateData } from 'lib/types/car'
import { WorkerBasicInfo } from 'lib/types/worker'
import { useState } from 'react'
import ErrorMessageModal from '../modal/ErrorMessageModal'
import SuccessProceedModal from '../modal/SuccessProceedModal'
import CarCreateForm from './CarCreateForm'

export default function CreateCar({ workers }: { workers: WorkerBasicInfo[] }) {
  const [saved, setSaved] = useState(false)
  const { trigger, isMutating, error, reset } = useAPICarCreate({
    onSuccess: () => {
      setSaved(true)
    },
  })
  const onSubmit = (data: CarCreateData) => {
    trigger(data)
  }

  return (
    <>
      <CarCreateForm
        onSubmit={onSubmit}
        isSending={isMutating}
        owners={workers}
      />
      {saved && <SuccessProceedModal onClose={() => window.history.back()} />}
      {error && <ErrorMessageModal onClose={reset} />}
    </>
  )
}
