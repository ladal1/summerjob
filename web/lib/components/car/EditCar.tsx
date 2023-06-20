'use client'
import { useAPICarUpdate } from 'lib/fetcher/car'
import type { CarComplete, CarUpdateData } from 'lib/types/car'
import { useState } from 'react'
import ErrorMessageModal from '../modal/ErrorMessageModal'
import SuccessProceedModal from '../modal/SuccessProceedModal'
import CarEditForm from './CarEditForm'

export default function EditCar({ car }: { car: CarComplete }) {
  const [saved, setSaved] = useState(false)
  const { trigger, isMutating, error, reset } = useAPICarUpdate(car.id, {
    onSuccess: () => {
      setSaved(true)
    },
  })
  const onSubmit = (data: CarUpdateData) => {
    trigger(data)
  }

  return (
    <>
      <CarEditForm onSubmit={onSubmit} car={car} isSending={isMutating} />
      {saved && <SuccessProceedModal onClose={() => window.history.back()} />}
      {error && <ErrorMessageModal onClose={reset} />}
    </>
  )
}
