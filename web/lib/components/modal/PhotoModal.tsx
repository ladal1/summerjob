import { useEffect, useState } from 'react'
import { Modal, ModalSize } from './Modal'
import Image from 'next/image'
import { calculateDimensions } from '../photo/photo'
import Link from 'next/link'

type PhotoModalProps = {
  onClose: () => void
  photo: string
}

export default function PhotoModal({
  onClose,
  photo
}: PhotoModalProps) {

  const [dimensions, setDimensions] = useState({
    width: 800,
    height: 800,
  });

  const [widthOfWindow, setWidthOfWindow] = useState(0)

  const handleResize = () => setWidthOfWindow(window.innerWidth)

  useEffect(() => {
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])


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
      <div className="d-flex justify-content-center justify-self-center justify-items-center">
        <div 
          className="cursor-pointer"
          style={{position: "relative", height: dimensions.height, width:dimensions.width}}
        > 
          <Image
            className="responsive"
            style={{objectFit: 'contain'}}
            alt="Fotografie"
            src={photo}
            fill
            sizes="100vw"
            loading="eager"
            key={Date.now()}
            onLoadingComplete={({ naturalWidth, naturalHeight }) => {
              setDimensions(calculateDimensions(naturalWidth, naturalHeight, {
                maxWidth: determineSizeByWidthOfWindow(), 
                maxHeight: determineSizeByWidthOfWindow()
              }))
            }}
            onMouseDown={(e) => { // open image in new tab with middle or left mouse click
              if( e.button === 1 || e.button === 0) {
                window.open(photo)
              }
            }}
          /> 
        </div>
      </div>
    </Modal>
  )
}