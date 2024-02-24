import { ChangeEvent, createRef, useEffect, useState } from 'react'
import { FieldErrors, FieldValues, Path, UseFormRegister } from 'react-hook-form'
import FormWarning from './FormWarning'
import { Label } from './Label'
import Image from 'next/image'
import PhotoModal from '../modal/PhotoModal'
import { calculateDimensions } from '../photo/photo'

interface ImageUploaderProps<FormData extends FieldValues> {
  id: Path<FormData>
  label: string
  secondaryLabel?: string
  photoInit?: string | null
  setPhotoFileState?: (state: boolean) => void
  errors: FieldErrors<FormData>
  register: UseFormRegister<FormData>
  removePhoto: () => void
  multiple?: boolean
  maxPhotos?: number
  maxFileSize?: number
}

export const ImageUploader = <FormData extends FieldValues> ({
  id,
  label,
  secondaryLabel,
  photoInit = null,
  setPhotoFileState,
  errors,
  register,
  removePhoto,
  multiple = false,
  maxPhotos = 1,
  maxFileSize = 1024*1024*10 // 10MB
}: ImageUploaderProps<FormData>) => {

  const error = errors?.[id]?.message as string | undefined
  const [previewUrl, setPreviewUrl] = useState<string | null>(photoInit)
  const [showPhotoModal, setShowPhotoModal] = useState(false)

  const [dimensions, setDimensions] = useState({
    width: 220,
    height: 220,
  })

  const [widthOfWindow, setWidthOfWindow] = useState(0)

  const handleResize = () => setWidthOfWindow(window.innerWidth)

  useEffect(() => {
      handleResize()
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  const onFileUploadChange = (e: ChangeEvent<HTMLInputElement>) => {
    const fileInput = e.target

    if (!fileInput.files || fileInput.files.length === 0) {
      setPreviewUrl(null)
      return
    }

    const file = fileInput.files[0]

    /** File validation */
    if (!file.type.startsWith('image') || file.size > maxFileSize) { 
      setPreviewUrl(null)
      return
    }

    /** Setting file state */
    setPreviewUrl(URL.createObjectURL(file)) // we will use this to show the preview of the image
    if(setPhotoFileState)
      setPhotoFileState(false) // this indicates that file was uploaded and not removed
  }

  const onRemoveImage = () => {
    setPreviewUrl(null)
    removePhoto()
  }
  
  return (
    <>
      <Label
        id={id}
        label={label}
      />
      {secondaryLabel && (
        <p className="text-muted">
          {secondaryLabel}
        </p>
      )}
      <div className="row mb-2">
        <input
          type="file"
          multiple={multiple}
          id="upload-photo"
          {...register(id as Path<FormData>, { onChange: (e) => onFileUploadChange(e) })}
        />
      </div>
      <div className="d-inline-flex gap-2"> 
        {previewUrl && ( 
          <div className="d-inline-flex shadow bg-white rounded border p-3 pt-2 mb-2">
            <div className="container p-0 m-0">
              <div className="pb-2 row">
                <div className="col d-flex justify-content-end">
                  <button
                    className="btn btn-light p-2 pt-1 pb-1"
                    onClick={onRemoveImage}
                  >
                    <i className="fa-regular fa-circle-xmark smj-action-delete" />
                  </button>
                </div>
              </div>
              <div className="col">
                <div className="d-flex justify-content-center">
                  <div 
                    className="cursor-pointer" 
                    style={{position: "relative", height: dimensions.height, width: dimensions.width}}
                  > 
                    <Image
                      className="responsive"
                      alt="Fotografie"
                      src={previewUrl}
                      fill
                      loading="eager"
                      key={Date.now()}
                      onClick={() => setShowPhotoModal(true)}
                      onLoadingComplete={({ naturalWidth, naturalHeight }) => {
                        setDimensions(calculateDimensions(naturalWidth, naturalHeight, {maxWidth: widthOfWindow > 750 ? 320 : 220, maxHeight: widthOfWindow > 750 ? 320 : 220}))
                      }}
                    />    
                  </div>              
                </div>
              </div>
            </div>
          </div>
        )}
        {!previewUrl && ( 
        <div className="smj-add-photo-icon border rounded shadow">
          <label className="cursor-pointer m-4" htmlFor="upload-photo">
            <svg
              className="photo-default"
              viewBox="-64 -64 128 128"
              xmlns="http://www.w3.org/2000/svg"
              strokeWidth="6"
              stroke="#888"
              fill="none"
            >
              <path d="M0,-64 V64 M-64, 0 H64" />
            </svg>
          </label>
        </div>
      )}  
      </div>
      {showPhotoModal && previewUrl && <PhotoModal widthOfWindow={widthOfWindow} photo={previewUrl} onClose={() => setShowPhotoModal(false)} />}
      <FormWarning message={error} />
    </>
  )
}
