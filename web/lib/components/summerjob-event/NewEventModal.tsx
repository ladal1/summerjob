import { zodResolver } from '@hookform/resolvers/zod'
import { useAPISummerJobEventCreate } from 'lib/fetcher/summerjob-event'
import { SummerJobEventCreateSchema } from 'lib/types/summerjob-event'
import {
  SummerJobEventsAPIPostData,
  SummerJobEventsAPIPostResponse,
} from 'pages/api/summerjob-events'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { TextInput } from '../forms/input/TextInput'
import { Label } from '../forms/Label'
import { Modal, ModalSize } from '../modal/Modal'

const schema = SummerJobEventCreateSchema

interface NewEventModalProps {
  onConfirm: (newPlanId: string) => void
  onReject: () => void
}

export default function NewEventModal({
  onConfirm,
  onReject,
}: NewEventModalProps) {
  const { trigger, isMutating } = useAPISummerJobEventCreate({
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
        <TextInput
          id="name"
          label="Název ročníku"
          placeholder="Název ročníku"
          errors={errors}
          register={() => register('name')}
          mandatory
          margin={false}
        />
        <Label
          id="startDate"
          label="Začátek a konec"
          className="d-none d-md-block mt-4"
          mandatory
        />
        <div className="d-flex flex-column flex-md-row">
          <div className="d-flex flex-column flex-fill">
            <TextInput
              id="startDate"
              label="Začátek"
              type="date"
              labelClassName="d-md-none"
              mandatory
              errors={errors}
              register={() => register('startDate')}
            />
          </div>
          <div className="fs-3 mx-3 me-3 d-none d-md-block">-</div>
          <div className="d-flex flex-column flex-fill">
            <TextInput
              id="endDate"
              label="Konec"
              type="date"
              labelClassName="d-md-none"
              mandatory
              errors={errors}
              register={() => register('endDate')}
            />
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
