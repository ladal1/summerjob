'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAPIAreaUpdate } from 'lib/fetcher/area'
import { useAPIWorkers } from 'lib/fetcher/worker'
import {
  AreaUpdateData,
  AreaUpdateSchema,
  deserializeAreaComp,
} from 'lib/types/area'
import { Serialized } from 'lib/types/serialize'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { OtherAttributesInput } from '../forms/input/OtherAttributesInput'
import { TextInput } from '../forms/input/TextInput'
import { Form } from '../forms/Form'
import { Label } from '../forms/Label'
import FormWarning from '../forms/FormWarning'

interface EditAreaProps {
  sArea: Serialized
}

export default function EditAreaForm({ sArea }: EditAreaProps) {
  const area = deserializeAreaComp(sArea)
  const { trigger, error, isMutating, reset } = useAPIAreaUpdate(area)
  const [saved, setSaved] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields },
  } = useForm<AreaUpdateData>({
    resolver: zodResolver(AreaUpdateSchema),
    defaultValues: {
      name: area.name,
      requiresCar: area.requiresCar,
      managerId: area.managerId ?? '',
    },
  })

  const { data: workers } = useAPIWorkers()
  const managerOptions = useMemo(() => {
    const teamMembers = (workers ?? [])
      .filter(w => w.isTeam)
      .map(w => ({ id: w.id, name: `${w.firstName} ${w.lastName}` }))
    if (
      area.manager &&
      !teamMembers.some(member => member.id === area.manager!.id)
    ) {
      teamMembers.unshift({
        id: area.manager.id,
        name: `${area.manager.firstName} ${area.manager.lastName}`,
      })
    }
    return teamMembers
  }, [workers, area.manager])

  const onSubmit = (data: AreaUpdateData) => {
    trigger(data, {
      onSuccess: () => {
        setSaved(true)
        reset()
      },
    })
  }

  const router = useRouter()

  const onConfirmationClosed = () => {
    setSaved(false)
    router.back()
  }

  return (
    <>
      <Form
        label="Upravit oblast"
        isInputDisabled={isMutating}
        onConfirmationClosed={onConfirmationClosed}
        resetForm={reset}
        saved={saved}
        error={error}
        formId="edit-area"
        isDirty={!saved && Object.keys(dirtyFields).length > 0}
      >
        <form
          id="edit-area"
          onSubmit={handleSubmit(onSubmit)}
          autoComplete="off"
        >
          <TextInput
            id="name"
            label="Název oblasti"
            placeholder="Název oblasti"
            register={() => register('name')}
            errors={errors}
            mandatory
            margin={false}
          />
          <OtherAttributesInput
            register={register}
            objects={[
              {
                id: 'requiresCar',
                icon: 'fa fa-car',
                label: 'Do oblasti je nutné dojet autem',
              },
              {
                id: 'supportsAdoration',
                icon: 'fa fa-church',
                label: 'V oblasti je možné adorovat',
              },
            ]}
          />
          <Label id="managerId" label="Vedoucí oblasti" />
          <select
            id="managerId"
            className="form-select smj-input p-0 fs-5"
            {...register('managerId')}
          >
            <option value="">Žádný</option>
            {managerOptions.map(worker => (
              <option key={worker.id} value={worker.id}>
                {worker.name}
              </option>
            ))}
          </select>
          <FormWarning
            message={errors.managerId?.message as string | undefined}
          />
        </form>
      </Form>
    </>
  )
}
