'use client'
import { useAPICars } from 'lib/fetcher/car'
import { useAPIRideCreate } from 'lib/fetcher/rides'
import { ActiveJobNoPlan } from 'lib/types/active-job'
import { RidesAPIPostData } from 'pages/api/plans/[planId]/active-jobs/[jobId]/rides'
import { useRef, useState } from 'react'
import { Modal, ModalSize } from '../modal/Modal'

const NO_DRIVER_AVAILABLE = 'NO_DRIVER_AVAILABLE'

interface AddRideButtonProps {
  job: ActiveJobNoPlan
}

export default function AddRideButton({ job }: AddRideButtonProps) {
  const { data: cars, isLoading: isLoadingCars } = useAPICars()
  const carsOfWorkers = cars?.filter(car =>
    job.workers.map(w => w.id).includes(car.ownerId)
  )
  const unusedCars = carsOfWorkers?.filter(
    car => !job.rides.map(r => r.carId).includes(car.id)
  )

  const selectRef = useRef<HTMLSelectElement>(null)

  const { trigger, isMutating, error, reset } = useAPIRideCreate(job, {
    onSuccess: () => {
      setShowAddRideModal(false)
    },
  })
  const [showAddRideModal, setShowAddRideModal] = useState(false)

  const addRide = () => {
    const carId = selectRef.current?.value
    if (!carId) {
      return
    }
    const car = unusedCars?.find(c => c.id === carId)
    if (!car) {
      return
    }
    const payload: RidesAPIPostData = {
      carId: car.id,
      driverId: car.ownerId,
      passengerIds: [],
    }
    trigger(payload)
  }

  const areDriversAvailable = unusedCars && unusedCars.length > 0
  return (
    <>
      <i
        className="fas fa-square-plus text-warning fs-4 cursor-pointer"
        onClick={() => setShowAddRideModal(true)}
      />
      {showAddRideModal && (
        <Modal
          title={'Přidat dopravu na job'}
          size={ModalSize.MEDIUM}
          onClose={() => setShowAddRideModal(false)}
        >
          <label htmlFor="select-ride">Vyberte dopravu:</label>
          <select
            className="form-select border p-2 mt-1"
            id="select-ride"
            ref={selectRef}
            defaultValue={
              !areDriversAvailable ? NO_DRIVER_AVAILABLE : undefined
            }
          >
            {unusedCars?.map(car => (
              <option value={car.id} key={car.id}>
                {car.owner.firstName} {car.owner.lastName}, {car.name}
              </option>
            ))}
            <option disabled hidden value={NO_DRIVER_AVAILABLE}>
              Žádný volný řidič
            </option>
          </select>
          <div className="d-flex justify-content-end mt-3">
            <button
              className="btn pt-2 pb-2 btn-primary"
              onClick={addRide}
              disabled={isMutating}
            >
              Přidat
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
