import { IconAndLabel } from '../forms/IconAndLabel'
import { Modal, ModalSize } from '../modal/Modal'
import { Sort, SortObject } from './SortPostsBy'

interface SortPostsModalProps {
  sorts: Sort[]
  selected: SortObject
  onSelected: (sort: SortObject) => void
  onClose: () => void
}

export const SortPostsModal = ({
  sorts,
  selected,
  onSelected,
  onClose,
}: SortPostsModalProps) => {
  return (
    <Modal title="Seřadit podle" size={ModalSize.MEDIUM} onClose={onClose}>
      {sorts.map(sort => (
        <div key={sort.id} className="row align-items-center mb-2 p-2">
          <div className="col-md-3">
            <IconAndLabel icon={sort.icon} label={sort.label} />
          </div>
          <div className="col ml-2">
            {sort.content?.map((choice, index) => (
              <div key={choice.id}>
                <div
                  className={`smj-sort-choice p-2 ${
                    selected.id === choice.id ? 'selected' : ''
                  }`}
                  onClick={e => {
                    e.preventDefault()
                    e.stopPropagation()
                    onSelected({
                      id: choice.id,
                      label: `${sort.label} (${choice.label})`,
                    })
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <span>{choice.label}</span>
                    {selected.id === choice.id && (
                      <i className="fas fa-check"></i>
                    )}
                  </div>
                </div>
                {sort.content && sort.content?.length - 1 > index && (
                  <hr className="my-1" />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </Modal>
  )
}
