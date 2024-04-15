'use client'
import {
  ActiveJobNoPlan,
  ActiveJobUpdateData,
  ActiveJobUpdateSchema,
} from 'lib/types/active-job'
import { useState } from 'react'
import { Modal, ModalSize } from '../modal/Modal'
import { useAPIActiveJobUpdate } from 'lib/fetcher/active-job'
import { TextAreaInput } from '../forms/input/TextAreaInput'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { pick } from 'lib/helpers/helpers'

interface ToggleCompletedCheckProps {
  job: ActiveJobNoPlan
}

export default function ToggleCompletedCheck({
  job,
}: ToggleCompletedCheckProps) {
  const {
    register,
    handleSubmit,
    formState: { dirtyFields, errors },
  } = useForm<ActiveJobUpdateData>({
    resolver: zodResolver(ActiveJobUpdateSchema),
    defaultValues: {
      completed: job.completed,
      proposedJob: {
        privateDescription: job.proposedJob.privateDescription,
      },
    },
  })

  const [checked, setChecked] = useState(job.completed)

  const { trigger, isMutating } = useAPIActiveJobUpdate(job.id, job.planId)
  const [showNoteModal, setShowNoteModal] = useState(false)

  const onSubmit = (data: ActiveJobUpdateData) => {
    const modified = pick(
      data,
      ...Object.keys(dirtyFields)
    ) as ActiveJobUpdateData
    trigger(modified, {
      onSuccess: () => {
        setChecked(!checked)
        setShowNoteModal(false)
      },
    })
  }

  return (
    <>
      <input
        id="completed"
        className="form-check-input smj-checkbox"
        type="checkbox"
        checked={checked}
        {...register('completed', {
          onChange: () => {
            setShowNoteModal(true)
          },
        })}
      />
      {showNoteModal && (
        <Modal
          title={`Upravit poznámku - ${job.proposedJob.name}`}
          size={ModalSize.MEDIUM}
          onClose={() => setShowNoteModal(false)}
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            <TextAreaInput
              id={'proposedJob.privateDescription'}
              label={'Poznámka pro organizátory'}
              register={() => register('proposedJob.privateDescription')}
              rows={4}
              margin={false}
              errors={errors}
            />
            <div className="d-flex justify-content-end mt-3">
              <input
                type={'submit'}
                className="btn btn-primary"
                value={'Uložit'}
                disabled={isMutating}
              />
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
