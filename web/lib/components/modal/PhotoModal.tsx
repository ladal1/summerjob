import { useState } from 'react'
import { Modal, ModalSize } from './Modal'
import Image from 'next/image'
import { calculateDimensions } from '../photo/photo'

type PhotoModalProps = {
  widthOfWindow: number
  onClose: () => void
  photo: string
}

export default function PhotoModal({
  widthOfWindow,
  onClose,
  photo
}: PhotoModalProps) {

  const [dimensions, setDimensions] = useState({
    width: 200,
    height: 200,
  });

  const determineSizeByWidthOfWindow = () => {
    if(widthOfWindow > 1000)
      return 800
    else if(widthOfWindow > 700)
      return 500
    else
      return 300
  }

  return (
    <Modal size={ModalSize.LARGE} onClose={onClose}>
      <div className="d-flex justify-content-center">
        <div style={{position: "relative", height: dimensions.height, width:dimensions.width}}> 
          <Image
            className="responsive"
            alt="Fotografie"
            src={photo}
            fill
            loading="eager"
            key={Date.now()}
            onLoadingComplete={({ naturalWidth, naturalHeight }) => {
              setDimensions(calculateDimensions(naturalWidth, naturalHeight, {
                maxWidth: determineSizeByWidthOfWindow(), 
                maxHeight: determineSizeByWidthOfWindow()
              }))
            }}
          /> 
        </div>
      </div>
    </Modal>
  )
}