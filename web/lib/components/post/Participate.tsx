import { useState } from 'react'

interface ParticipateProps {
  id: string
}

// TODO
export const Participate = ({ id }: ParticipateProps) => {
  const [isOpenedConfModal, setIsOpenedConfModal] = useState(false)
  const onCloseModal = () => {
    setIsOpenedConfModal(false)
  }
  return (
    <>
      <label className="form-check-label me-3" htmlFor="participation">
        Zúčastním se
      </label>
      <div className="form-check form-switch">
        <input
          className="form-check-input"
          type="checkbox"
          role="switch"
          id="participation"
        />
      </div>
    </>
  )
}
