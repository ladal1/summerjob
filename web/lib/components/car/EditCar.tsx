'use client'
import { useAPICarUpdate } from 'lib/fetcher/car'
import type { CarComplete, CarUpdateData } from 'lib/types/car'
import { useState } from 'react'
import ErrorMessageModal from '../modal/ErrorMessageModal'
import SuccessProceedModal from '../modal/SuccessProceedModal'
import CarEditForm from './CarEditForm'
import { useRouter } from 'next/navigation'

export default function EditCar({ car }: { car: CarComplete }) {
  const [saved, setSaved] = useState(false)
  const { trigger, isMutating, error, reset } = useAPICarUpdate(car.id, {
    onSuccess: () => {
      setSaved(true)
    },
  })
  const router = useRouter()
  
  const onSubmit = (data: CarUpdateData) => {
    trigger(data)
  }

  const onConfirmationClosed = () => {
    setSaved(false)
    router.back()
  }

  return (
    <>
      <CarEditForm onSubmit={onSubmit} car={car} isSending={isMutating} />
      {saved && <SuccessProceedModal onClose={onConfirmationClosed} />}
      {error && <ErrorMessageModal onClose={reset} />}
    </>
  )
}
