import { ChangeEvent, createRef, useEffect, useState } from 'react'
import { FieldErrors, FieldValues, Path, UseFormRegister } from 'react-hook-form'
import FormWarning from './FormWarning'
import { Label } from './Label'
import Image from 'next/image'
import PhotoModal from '../modal/PhotoModal'
import { calculateDimensions } from '../photo/photo'

interface ImageUploaderProps<FormData extends FieldValues> {
  id: Path<FormData>
  photoInit?: string | null
  setPhotoFileState?: (state: boolean) => void
  errors: FieldErrors<FormData>
  register: UseFormRegister<FormData>
  removePhoto: () => void
}

export const ImageUploader = <FormData extends FieldValues> ({
  id,
  photoInit = null,
  setPhotoFileState,
  errors,
  register,
  removePhoto
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
    if (!file.type.startsWith('image') || file.size > 1024*1024*10) { // 10MB
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
        label="Fotografie"        
      />
      <div className="d-inline-flex shadow bg-white rounded border p-3 pt-2 mb-2">
        <div className="container p-0 m-0">
          {previewUrl && (
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
          )}
          <div className="col">
            <div className="d-flex justify-content-center">
              {previewUrl ? ( 
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
                ) : (
                  <>
                    <label className="cursor-pointer" htmlFor="upload-photo">
                      <svg
                        className="photo-default"
                        viewBox="0 0 64 64"
                        xmlns="http://www.w3.org/2000/svg"
                        strokeWidth="3"
                        stroke="#000000"
                        fill="none"
                      >
                        <circle cx="32" cy="18.14" r="11.14" />
                        <path d="M54.55,56.85A22.55,22.55,0,0,0,32,34.3h0A22.55,22.55,0,0,0,9.45,56.85Z" />
                      </svg>
                    </label>
                    <input
                      className="smj-file-upload"
                      type="file"
                      id="upload-photo"
                      {...register(id, {onChange: (e) => {onFileUploadChange(e)}})} // we will use the file state, to send it later to the server
                    />
                  </>
                )}
            </div>
          </div>
        </div>
      </div>
      {showPhotoModal && previewUrl && <PhotoModal widthOfWindow={widthOfWindow} photo={previewUrl} onClose={() => setShowPhotoModal(false)} />}
      <FormWarning message={error} />
    </>
  )
}
