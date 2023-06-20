import { useAPIRideDelete } from 'lib/fetcher/rides'
import { RideComplete } from 'lib/types/ride'
import ErrorMessageModal from '../modal/ErrorMessageModal'

interface DeleteRideButtonProps {
  ride: RideComplete
  onSuccess: () => void
}

export default function DeleteRideButton({
  ride,
  onSuccess,
}: DeleteRideButtonProps) {
  const { trigger, isMutating, error, reset } = useAPIRideDelete(ride, {
    onSuccess,
  })
  const deleteRide = () => {
    trigger()
  }
  return (
    <>
      {!isMutating && (
        <i
          className="fas fa-trash-alt cursor-pointer smj-action-delete"
          onClick={deleteRide}
        />
      )}
      {isMutating && (
        <i
          className="fas fa-spinner smj-action-delete spinning"
          title="Odstraňování..."
        ></i>
      )}
      {error && (
        <ErrorMessageModal
          onClose={reset}
          mainMessage={'Odstranění jízdy se nezdařilo.'}
        />
      )}
    </>
  )
}
