import { zodResolver } from '@hookform/resolvers/zod'
import { DateBool } from 'lib/data/dateSelectionType'
import { LabelWithIcon } from 'lib/data/enumMapping/enumMapping'
import { postTagMappingWithIcon } from 'lib/data/enumMapping/postTagMapping'
import { PostFilterSchema } from 'lib/types/post'
import { PostTag } from 'lib/types/enums'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { PillSelectItem } from '../filter-select/PillSelect'
import { DateSelectionInput } from '../forms/input/DateSelectionInput'
import { OtherAttributesInput } from '../forms/input/OtherAttributesInput'
import { PillSelectInput } from '../forms/input/PillSelectInput'
import { TimeInput } from '../forms/input/TimeInput'
import { Modal, ModalSize } from '../modal/Modal'

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
      showAll: filters.showAll,
    },
  })
  const onSubmit = (dataForm: PostFilterForm) => {
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
            setValue={setValue}
            allowSpecialButtons={true}
            margin={false}
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
            {
              id: 'showAll',
              icon: 'fas fa-eye',
              label: 'Zobrazit všechny příspěvky bez ohledu na den',
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
