import { useState } from 'react'
import { SortPostsModal } from './SortPostsModal'

export interface SortObject {
  id: string
  label: string
}

export interface Sort {
  id: string
  icon: string
  label: string
  content?: {
    id: string
    label: string
  }[]
}

interface SortPostsByProps {
  sorts: Sort[]
  selected: SortObject
  onSelected: (sort: SortObject) => void
}

export const SortPostsBy = ({
  sorts,
  selected,
  onSelected,
}: SortPostsByProps) => {
  const [isOpenedSortModal, setIsOpenedSortModal] = useState(false)
  const onCloseModal = () => {
    setIsOpenedSortModal(false)
  }
  return (
    <>
      {isOpenedSortModal && (
        <SortPostsModal
          sorts={sorts}
          selected={selected}
          onSelected={onSelected}
          onClose={onCloseModal}
        />
      )}
      <div
        onClick={() => setIsOpenedSortModal(true)}
        className="bg-white cursor-pointer p-2"
      >
        <i className={`fas fa-arrows-up-down me-2`}></i>
        <span className="overflow-ellipsis">{selected.label}</span>
      </div>
    </>
  )
}
