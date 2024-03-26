import { DateBool } from 'lib/data/dateSelectionType'
import { PostFilterDataInput } from 'lib/types/post'
import { useMemo, useState } from 'react'
import { FilterPostsModal } from './FilterPostsModal'

interface FilterPostsByProps {
  filters: PostFilterDataInput
  setFilters: (filter: PostFilterDataInput) => void
  allDates: DateBool[][]
}

export const FilterPostsBy = ({
  filters,
  setFilters,
  allDates,
}: FilterPostsByProps) => {
  const [isOpenedFilterModal, setIsOpenedFilterModal] = useState(false)
  const onCloseModal = () => {
    setIsOpenedFilterModal(false)
  }
  const activeFilter: number = useMemo(() => {
    let count = 0

    if (filters.availability.length !== 0) {
      count++
    }
    if (filters.tags && filters.tags.length !== 0) {
      count++
    }
    if (filters.timeFrom) {
      count++
    }
    if (filters.timeTo) {
      count++
    }
    if (filters.participate) {
      count++
    }

    return count
  }, [filters])

  return (
    <>
      {isOpenedFilterModal && (
        <FilterPostsModal
          filters={filters}
          setFilters={setFilters}
          onClose={onCloseModal}
          allDates={allDates}
        />
      )}
      <div
        onClick={() => setIsOpenedFilterModal(true)}
        className="bg-white cursor-pointer p-2"
      >
        <i className={`fas fa-filter me-2`}></i>
        <span>Filtry</span>
        {activeFilter > 0 && (
          <span>
            {' | '}
            <span style={{ color: 'red' }}> {activeFilter}</span>
          </span>
        )}
      </div>
    </>
  )
}
