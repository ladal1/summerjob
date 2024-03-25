import { zodResolver } from '@hookform/resolvers/zod'
import { DateBool } from 'lib/data/dateSelectionType'
import { pick } from 'lib/helpers/helpers'
import { PostFilterSchema } from 'lib/types/post'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import FormWarning from '../forms/FormWarning'
import { DateSelectionInput } from '../forms/input/DateSelectionInput'
import { OtherAttributesInput } from '../forms/input/OtherAttributesInput'
import { Label } from '../forms/Label'
import { Modal, ModalSize } from '../modal/Modal'
import { PillSelectInput } from '../forms/input/PillSelectInput'
import { LabelWithIcon } from 'lib/data/enumMapping/enumMapping'
import { postTagMappingWithIcon } from 'lib/data/enumMapping/postTagMapping'
import { PostTag } from 'lib/prisma/client'
import { PillSelectItem } from '../filter-select/PillSelect'

const schema = PostFilterSchema
type PostFilterForm = z.input<typeof schema>

interface FilterPostsModalProps {
  filters: PostFilterForm
  setFilters: (filters: PostFilterForm) => void
  onClose: () => void
  allDates: DateBool[][]
}

export const FilterPostsModal = ({
  filters,
  setFilters,
  onClose,
  allDates,
}: FilterPostsModalProps) => {
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<PostFilterForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      availability: filters.availability.map(date => new Date(date).toJSON()),
      timeFrom: filters.timeFrom,
      timeTo: filters.timeTo,
      tags: filters.tags,
      participate: filters.participate,
    },
  })
  const onSubmit = (dataForm: PostFilterForm) => {
    console.log(dataForm)
    setFilters(dataForm)
    onClose()
  }

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

  return (
    <Modal title="Filtrovat podle" size={ModalSize.MEDIUM} onClose={onClose}>
      <form id="edit-filters" onSubmit={handleSubmit(onSubmit)}>
        <div className="d-flex flex-row">
          <DateSelectionInput
            id="availability"
            label="Platné pro dny"
            register={() => register('availability')}
            days={allDates}
            margin={false}
          />
        </div>
        <Label id="timeFrom" label="Čas" />
        <div className="d-flex w-50">
          <input
            className="form-control smj-input p-0 fs-5"
            id="timeFrom"
            placeholder="00:00"
            type="time"
            {...register('timeFrom')}
          />
          <span className="ps-4 pe-4">-</span>
          <input
            className="form-control smj-input p-0 fs-5"
            id="timeTo"
            placeholder="00:00"
            type="time"
            {...register('timeTo')}
          />
        </div>
        {(errors.timeFrom || errors.timeTo) && (
          <FormWarning
            message={
              (errors?.timeFrom?.message as string | undefined) ||
              (errors?.timeTo?.message as string | undefined)
            }
          />
        )}
        <PillSelectInput
          id="tags"
          label="Tagy"
          placeholder={'Vyberte tagy'}
          items={manageTagSelectItems()}
          init={fetchTagSelectItems(filters.tags ?? [])}
          removeExisting={removeExistingTag}
          register={selectTags}
          errors={errors}
        />
        <OtherAttributesInput
          label="Další"
          register={register}
          objects={[
            {
              id: 'participate',
              icon: 'fas fa-people-pulling',
              label: 'Účastním se',
            },
          ]}
        />
      </form>
      <div className="d-flex justify-content-between gap-3 mt-4">
        <button className="btn btn-secondary" type="button" onClick={onClose}>
          Zpět
        </button>
        <input
          form="edit-filters"
          type={'submit'}
          className="btn btn-primary"
          value={'Uložit'}
        />
      </div>
    </Modal>
  )
}
