'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { DateBool } from 'lib/data/dateSelectionType'
import { LabelWithIcon } from 'lib/data/enumMapping/enumMapping'
import { postTagMappingWithIcon } from 'lib/data/enumMapping/postTagMapping'
import { useAPIPostUpdate } from 'lib/fetcher/post'
import { pick, removeRedundantSpace } from 'lib/helpers/helpers'
import { PostTag } from 'lib/prisma/client'
import { deserializePost, PostUpdateSchema } from 'lib/types/post'
import { Serialized } from 'lib/types/serialize'
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

const schema = PostUpdateSchema
type PostForm = z.input<typeof schema>

interface EditPostProps {
  serializedPost: Serialized
  allDates: DateBool[][]
}
export default function EditPost({ serializedPost, allDates }: EditPostProps) {
  const post = deserializePost(serializedPost)
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, dirtyFields },
  } = useForm<PostForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: post.name,
      availability: post.availability.map(day => day.toJSON()),
      timeFrom: post.timeFrom,
      timeTo: post.timeTo,
      address: post.address,
      coordinates: post.coordinates,
      shortDescription: post.shortDescription,
      longDescription: post.longDescription,
      tags: post.tags,
      isMandatory: post.isMandatory,
      isOpenForParticipants: post.isOpenForParticipants,
    },
  })

  const router = useRouter()

  const [saved, setSaved] = useState(false)
  const { trigger, isMutating, reset, error } = useAPIPostUpdate(post.id, {
    onSuccess: () => {
      setSaved(true)
      router.refresh()
    },
  })

  const onSubmit = (dataForm: PostForm) => {
    const modified = pick(
      dataForm,
      ...Object.keys(dirtyFields)
    ) as unknown as PostForm
    trigger(modified)
  }

  //#region Coordinates and Address

  const getCoordinates = (): [number, number] | null => {
    if (post.coordinates && post.coordinates[0] && post.coordinates[1]) {
      return [post.coordinates[0], post.coordinates[1]]
    }
    return null
  }

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

  const removeExistingPhoto = () => {
    setValue('photoFileRemoved', true, {
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

  const fetchTagSelectItems = (tags: PostTag[]): PillSelectItem[] => {
    const selectItems: PillSelectItem[] = tags.map(tagItem => {
      return {
        id: tagItem,
        name: postTagMappingWithIcon[tagItem].name,
        searchable: postTagMappingWithIcon[tagItem].name,
        icon: postTagMappingWithIcon[tagItem].icon,
      }
    })
    return selectItems
  }

  const removeExistingTag = (id: string) => {
    const prevTags = getValues('tags') || []
    const newTags = prevTags.filter(item => item !== (id as PostTag))
    setValue('tags', newTags, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  const selectTags = (items: PillSelectItem[]) => {
    const tags = items.map(item => item.id as PostTag)
    setValue('tags', tags, { shouldDirty: true, shouldValidate: true })
  }
  //#endregion

  const onConfirmationClosed = () => {
    setSaved(false)
    router.back()
  }

  return (
    <Form
      label="Upravit příspěvek"
      isInputDisabled={isMutating}
      onConfirmationClosed={onConfirmationClosed}
      resetForm={reset}
      saved={saved}
      error={error}
      formId="edit-post"
    >
      <form id="edit-post" onSubmit={handleSubmit(onSubmit)}>
        <TextInput
          id="name"
          label="Název"
          placeholder="Název"
          register={() =>
            register('name', {
              onChange: e => {
                e.target.value = removeRedundantSpace(e.target.value)
              },
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
            init: post.address ?? '',
            register: registerAdress,
          }}
          coordinates={{
            id: 'coordinates',
            label: 'Souřadnice',
            placeholder: '0, 0',
            init: getCoordinates(),
            register: registerCoordinates,
          }}
          errors={errors}
        />
        <ImageUploader
          id="photoFile"
          label="Fotografie"
          secondaryLabel="Maximálně 1 soubor o maximální velikosti 10 MB."
          photoInit={
            post.photoPath
              ? [{ url: `/api/posts/${post.id}/photo`, index: '0' }]
              : null
          }
          errors={errors}
          registerPhoto={registerPhoto}
          removeNewPhoto={removeNewPhoto}
          removeExistingPhoto={removeExistingPhoto}
        />
        <PillSelectInput
          id="tags"
          label="Tagy"
          placeholder={'Vyberte tagy'}
          items={manageTagSelectItems()}
          init={fetchTagSelectItems(post.tags)}
          removeExisting={removeExistingTag}
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
  )
}
