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
      <div className="form-check align-self-center align-items-center d-flex ">
        <label className="form-check-label fs-7 text-truncate" htmlFor={id}>
          <b>Zúčastním se</b>
        </label>
        <input
          className="form-check-input smj-checkbox ms-2"
          type="checkbox"
          id={id}
        />
      </div>
    </>
  )
}
