import { useState } from 'react'
import { Modal, ModalSize } from './Modal'
import Image from 'next/image'
import { calculateDimensions } from '../photo/photo'

type PhotoModalProps = {
  onClose: () => void
  photo: string
}

export default function PhotoModal({
  onClose,
  photo
}: PhotoModalProps) {

  const [dimensions, setDimensions] = useState({
    width: 200,
    height: 200,
  });

  return (
    <Modal size={ModalSize.LARGE} onClose={onClose}>
      <div className="d-flex justify-content-center">
        <div style={{position: "relative", height: dimensions.height, width:dimensions.width}}> 
          <Image
            className="photo-uploaded"
            alt="Fotografie"
            src={photo}
            fill
            loading="eager"
            key={Date.now()}
            onLoadingComplete={({ naturalWidth, naturalHeight }) => {
              setDimensions(calculateDimensions(naturalWidth, naturalHeight, 800, 800))
            }}
          /> 
        </div>
      </div>
    </Modal>
  )
}