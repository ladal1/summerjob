import { ChangeEvent, useEffect, useState } from 'react'
import { FieldErrors, FieldValues, Path, UseFormRegister } from 'react-hook-form'
import { Label } from '../Label'
import Image from 'next/image'
import React from 'react'
import FormWarning from '../FormWarning'
import PhotoModal from 'lib/components/modal/PhotoModal'
import { calculateDimensions } from 'lib/components/photo/photo'

interface TestProps<FormData extends FieldValues> {
  id: Path<FormData>
  photoInit?: string[] | null
  setPhotoFileState?: (state: boolean) => void
  errors: FieldErrors<FormData>
  register: UseFormRegister<FormData>
  removePhoto: (index: number) => void
  multiple?: boolean
  maxPhotos?: number
}

export const Test = <FormData extends FieldValues> ({
  id,
  photoInit = null,
  setPhotoFileState,
  errors,
  register,
  removePhoto,
  multiple = false,
  maxPhotos = 2
}: TestProps<FormData>) => {

  const error = errors?.[id]?.message as string | undefined
  const [previewUrls, setPreviewUrls] = useState<(string | null)[]>(photoInit || [])
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(1)
  const [dimensions, setDimensions] = useState<{ width: number; height: number }[]>([])
  const [widthOfWindow, setWidthOfWindow] = useState(0)

  const handleResize = () => setWidthOfWindow(window.innerWidth)

  useEffect(() => {
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const onFileUploadChange = (e: ChangeEvent<HTMLInputElement>) => {
    const fileInput = e.target

    if (!fileInput.files || fileInput.files.length === 0 || (previewUrls.length + fileInput.files.length > maxPhotos)) {
      return
    }

    const newPreviewUrls = Array.from(fileInput.files).map((file) => {
      if (!file.type.startsWith('image') || file.size > 1024 * 1024 * 10) {
        return null
      }

      if (setPhotoFileState) {
        setPhotoFileState(false)
      }

      return URL.createObjectURL(file)
    })

    setPreviewUrls((prevPreviewUrls) => [...prevPreviewUrls, ...newPreviewUrls])
  }

  const onRemoveImage = (index: number) => {
    const newPreviewUrls = [...previewUrls]
    newPreviewUrls.splice(index, 1)
    setPreviewUrls(newPreviewUrls)
    removePhoto(index)
  }

  const openPhotoModal = (index: number) => {
    setCurrentPhotoIndex(index)
    setShowPhotoModal(true)
  }

  const updateDimensionsForIndex = (index: number, newSize: {width: number, height: number}) => {
    setDimensions((prevDimensions) => {
      const updatedDimensions = [...prevDimensions];
      updatedDimensions[index] = { width: newSize.width, height: newSize.height };
      return updatedDimensions;
    })
  }

  return (
    <>
      <Label
        id={id}
        label="Fotografie"
      />
      <div className="d-inline-flex gap-2 flex-wrap align-items-center">
        {previewUrls.map((url, index) => (
          <React.Fragment key={index}>
            {url && (
              <div className="d-flex shadow bg-white rounded border p-3 pt-2 mb-2">
                <div className="container p-0 m-0">
                  <div className="pb-2">
                    <div className="d-flex justify-content-end">
                      <button
                        className="btn btn-light p-2 pb-1"
                        onClick={() => onRemoveImage(index)}
                      >
                        <i className="fa-solid fa-circle-xmark smj-action-delete smj-photo-icon-delete"/>
                      </button>
                    </div>
                  </div>
                  <div className="d-flex justify-content-center align-items-center">
                    <div
                      className="cursor-pointer"
                      style={{ 
                        position: 'relative', 
                        height: dimensions[index] && dimensions[index].height ? dimensions[index].height : 200, 
                        width: dimensions[index] && dimensions[index].width ? dimensions[index].width : 200 }}
                    >
                      <Image
                        className="responsive"
                        alt={`Fotografie ${index + 1}`}
                        src={url}
                        fill
                        loading="eager"
                        key={Date.now()}
                        onClick={() => openPhotoModal(index)}
                        onLoadingComplete={({ naturalWidth, naturalHeight }) => {
                          updateDimensionsForIndex(index, calculateDimensions(naturalWidth, naturalHeight, {
                              maxWidth: widthOfWindow > 750 ? 320 : 220,
                              maxHeight: widthOfWindow > 750 ? 320 : 220,
                            })
                          )
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
        {previewUrls.length < maxPhotos && (
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
            <input
              className="smj-file-upload"
              type="file"
              multiple={multiple}
              id="upload-photo"
              {...register(id, { onChange: (e) => onFileUploadChange(e) })}
            />
          </div>
        )}
      </div>
      
      {showPhotoModal && currentPhotoIndex !== null && previewUrls[currentPhotoIndex] && (
        <PhotoModal
          widthOfWindow={widthOfWindow}
          photo={previewUrls[currentPhotoIndex] as string}
          onClose={() => setShowPhotoModal(false)}
        />
      )}
      <FormWarning message={error} />
    </>
  )
}