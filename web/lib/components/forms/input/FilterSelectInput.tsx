import {
  FieldErrors,
  FieldValues,
  UseFormRegisterReturn,
} from 'react-hook-form'
import {
  FilterSelect,
  FilterSelectItem,
} from 'lib/components/filter-select/FilterSelect'
import { WorkerBasicInfo } from 'lib/types/worker'
import FormWarning from '../FormWarning'

interface FilterSelectInputProps<FormData extends FieldValues> {
  id: string
  label: string
  placeholder: string
  owners: WorkerBasicInfo[]
  register: () => UseFormRegisterReturn
  errors: FieldErrors<FormData>
  onSelect: (item: FilterSelectItem) => void
}

export const FilterSelectInput = <FormData extends FieldValues>({
  id,
  label,
  placeholder,
  owners,
  register,
  errors,
  onSelect,
}: FilterSelectInputProps<FormData>) => {
  const error = errors?.[id]?.message as string | undefined

  function workerToSelectItem(worker: WorkerBasicInfo): FilterSelectItem {
    return {
      id: worker.id,
      name: `${worker.firstName} ${worker.lastName}`,
      searchable: `${worker.firstName} ${worker.lastName}`,
      item: (
        <div>
          {worker.firstName} {worker.lastName}
        </div>
      ),
    }
  }

  const ownerItems = owners.map(workerToSelectItem)

  return (
    <div className="d-flex flex-column m-0">
      <label className="form-label d-block fw-bold mt-4" htmlFor={id}>
        {label}
      </label>
      <FilterSelect
        placeholder={placeholder}
        items={ownerItems}
        onSelected={onSelect}
      />
      <input type={'hidden'} {...register()} />
      <FormWarning message={error} />
    </div>
  )
}
