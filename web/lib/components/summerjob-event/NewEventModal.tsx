import { zodResolver } from '@hookform/resolvers/zod'
import { useAPISummerJobEventCreate } from 'lib/fetcher/summerjob-event'
import { SummerJobEventCreateSchema } from 'lib/types/summerjob-event'
import {
  SummerJobEventsAPIPostData,
  SummerJobEventsAPIPostResponse,
} from 'pages/api/summerjob-events'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Modal, ModalSize } from '../modal/Modal'

interface NewEventModalProps {
  onConfirm: (newPlanId: string) => void
  onReject: () => void
}
export default function NewEventModal({
  onConfirm,
  onReject,
}: NewEventModalProps) {
  const { trigger, error, isMutating } = useAPISummerJobEventCreate({
    onSuccess: (data: SummerJobEventsAPIPostResponse) => {
      onConfirm(data.id)
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  })

  const onSubmit = (data: SummerJobEventsAPIPostData) => {
    trigger(data)
  }

  return (
    <Modal
      title={'Vytvořit nový ročník'}
      size={ModalSize.MEDIUM}
      onClose={onReject}
    >
      <form onSubmit={handleSubmit(onSubmit)} autoComplete={'off'}>
        <label className="form-label fw-bold" htmlFor="name">
          Název ročníku
        </label>
        <input
          id="name"
          className="form-control p-0 fs-5"
          type="text"
          placeholder="Název ročníku"
          {...register('name')}
        />
        {errors.name?.message && (
          <p className="text-danger">{errors.name.message as string}</p>
        )}
        <label
          className="form-label fw-bold mt-4 d-none d-md-block"
          htmlFor="dayStart"
        >
          Začátek a konec
        </label>
        <div className="d-flex flex-column flex-md-row">
          <div className="d-flex flex-column flex-fill">
            <label
              className="form-label fw-bold mt-4 d-block d-md-none"
              htmlFor="dayStart"
            >
              Začátek
            </label>

            <input
              className="form-control p-1 fs-5"
              id="dayStart"
              type="date"
              {...register('startDate', { valueAsDate: true })}
            />
            <p className="text-danger">
              {errors.startDate?.message
                ? (errors.startDate.message as string)
                : ' '}
            </p>
          </div>
          <div className="fs-3 ms-3 me-3 d-none d-md-block">-</div>
          <div className="d-flex flex-column flex-fill">
            <label
              className="form-label fw-bold mt-4 d-block d-md-none"
              htmlFor="dayEnd"
            >
              Konec
            </label>
            <input
              className="form-control p-1 fs-5"
              id="dayEnd"
              type="date"
              {...register('endDate', { valueAsDate: true })}
            />
            <p className="text-danger">
              {errors.endDate?.message
                ? (errors.endDate.message as string)
                : ' '}
            </p>
          </div>
        </div>
        <div className="d-flex justify-content-end mt-4">
          <input
            type="submit"
            className="btn pt-2 pb-2 btn-primary"
            value={'Vytvořit'}
            disabled={isMutating}
          />
        </div>
      </form>
    </Modal>
  )
}

const schema = SummerJobEventCreateSchema.refine(
  data => data.startDate <= data.endDate,
  data => ({
    message: 'Final date must be after starting date',
    path: ['endDate'],
  })
)
