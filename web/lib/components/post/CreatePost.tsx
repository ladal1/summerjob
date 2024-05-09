'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { DateBool } from 'lib/data/dateSelectionType'
import { LabelWithIcon } from 'lib/data/enumMapping/enumMapping'
import { postTagMappingWithIcon } from 'lib/data/enumMapping/postTagMapping'
import { useAPIPostCreate } from 'lib/fetcher/post'
import { removeRedundantSpace } from 'lib/helpers/helpers'
import { PostTag } from 'lib/prisma/client'
import { PostCreateData, PostCreateSchema } from 'lib/types/post'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { PillSelectItem } from '../filter-select/PillSelect'
import { Form } from '../forms/Form'
import { ImageUploader } from '../forms/ImageUploader'
import { DateSelectionInput } from '../forms/input/DateSelectionInput'
import { MapInput } from '../forms/input/MapInput'
import { OtherAttributesInput } from '../forms/input/OtherAttributesInput'
import { PillSelectInput } from '../forms/input/PillSelectInput'
import { TextAreaInput } from '../forms/input/TextAreaInput'
import { TextInput } from '../forms/input/TextInput'
import { TimeInput } from '../forms/input/TimeInput'

const schema = PostCreateSchema
type PostForm = z.input<typeof schema>

interface CreatePostProps {
  allDates: DateBool[][]
}
export default function CreatePost({ allDates }: CreatePostProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PostForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      availability: [],
    },
  })

  const router = useRouter()

  const [saved, setSaved] = useState(false)

  const { trigger, isMutating, reset, error } = useAPIPostCreate({
    onSuccess: () => {
      setSaved(true)
      router.refresh()
    },
  })

  const onSubmit = (dataForm: PostForm) => {
    trigger(dataForm as PostCreateData)
  }

  const onConfirmationClosed = () => {
    setSaved(false)
    router.back()
  }

  //#region Coordinates and Address

  const registerCoordinates = (coords: [number, number]) => {
    setValue('coordinates', coords, { shouldDirty: true, shouldValidate: true })
  }

  const registerAdress = (address: string) => {
    setValue('address', address, { shouldDirty: true, shouldValidate: true })
  }

  //#endregion

  //#region Photo

  const removeNewPhoto = () => {
    setValue('photoFile', null, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  const registerPhoto = (fileList: FileList) => {
    setValue('photoFile', fileList, { shouldDirty: true, shouldValidate: true })
  }

  //#endregion

  //#region Tags

  const tagSelectItems: PillSelectItem[] = Object.entries(
    postTagMappingWithIcon
  ).map(([key, content]) => ({
    id: key,
    name: (content as LabelWithIcon).name,
    searchable: (content as LabelWithIcon).name,
    icon: (content as LabelWithIcon).icon,
  }))

  const manageTagSelectItems = (): PillSelectItem[][] => {
    const allTags = tagSelectItems
    return [allTags]
  }

  const selectTags = (items: PillSelectItem[]) => {
    const tags = items.map(item => item.id as PostTag)
    setValue('tags', tags, { shouldDirty: true, shouldValidate: true })
  }
  //#endregion

  return (
    <>
      <Form
        label="Přidat příspěvek"
        isInputDisabled={isMutating}
        onConfirmationClosed={onConfirmationClosed}
        resetForm={reset}
        saved={saved}
        error={error}
        formId="create-post"
      >
        <form id="create-post" onSubmit={handleSubmit(onSubmit)}>
          <TextInput
            id="name"
            label="Název"
            placeholder="Název"
            register={() =>
              register('name', {
                onChange: e =>
                  (e.target.value = removeRedundantSpace(e.target.value)),
              })
            }
            errors={errors}
            mandatory
            margin={false}
          />
          <TextAreaInput
            id="shortDescription"
            label="Krátký popis"
            placeholder="Popis"
            rows={2}
            register={() => register('shortDescription')}
            errors={errors}
            mandatory
          />
          <TextAreaInput
            id="longDescription"
            label="Dlouhý popis"
            placeholder="Popis"
            rows={4}
            register={() => register('longDescription')}
            errors={errors}
          />
          <div className="d-flex flex-row">
            <DateSelectionInput
              id="availability"
              label="Platné pro dny"
              register={() => register('availability')}
              days={allDates}
            />
          </div>
          <TimeInput
            label="Čas"
            register={register}
            errors={errors}
            setValue={setValue}
            timeFromId="timeFrom"
            timeToId="timeTo"
          />
          <MapInput
            address={{
              id: 'address',
              label: 'Adresa',
              placeholder: 'Adresa',
              register: registerAdress,
            }}
            coordinates={{
              id: 'coordinates',
              label: 'Souřadnice',
              placeholder: '0, 0',
              register: registerCoordinates,
            }}
            errors={errors}
          />
          <ImageUploader
            id="photoFile"
            label="Fotografie"
            secondaryLabel="Maximálně 1 soubor o maximální velikosti 10 MB."
            errors={errors}
            registerPhoto={registerPhoto}
            removeNewPhoto={removeNewPhoto}
          />
          <PillSelectInput
            id="tags"
            label="Tagy"
            placeholder={'Vyberte tagy'}
            items={manageTagSelectItems()}
            register={selectTags}
            errors={errors}
          />
          <OtherAttributesInput
            label="Další vlastnosti"
            register={register}
            objects={[
              {
                id: 'isMandatory',
                icon: 'fas fa-people-pulling',
                label: 'Povinná účast pro všechny',
              },
              {
                id: 'isOpenForParticipants',
                icon: 'fas fa-door-open',
                label: 'Otevřeno pro zapsání účastníky',
              },
            ]}
          />
        </form>
      </Form>
    </>
  )
}
