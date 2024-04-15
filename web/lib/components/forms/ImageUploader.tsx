import PhotoModal from 'lib/components/modal/PhotoModal'
import Image from 'next/image'
import React, { ChangeEvent, useState } from 'react'
import { FieldErrors, FieldValues, Path } from 'react-hook-form'
import FormWarning from './FormWarning'
import { Label } from './Label'

interface PreviewUrl {
  url: string
  index?: string
}

interface ImageUploaderProps<FormData extends FieldValues> {
  id: Path<FormData>
  label: string
  secondaryLabel?: string
  photoInit?: PreviewUrl[] | null
  errors: FieldErrors<FormData>
  registerPhoto: (fileList: FileList) => void
  removeExistingPhoto?: (index: string) => void
  removeNewPhoto: (index: number) => void
  multiple?: boolean
  maxPhotos?: number
  maxFileSize?: number
}

export const ImageUploader = <FormData extends FieldValues>({
  id,
  label,
  secondaryLabel,
  photoInit = null,
  errors,
  registerPhoto,
  removeExistingPhoto,
  removeNewPhoto,
  multiple = false,
  maxPhotos = 1,
  maxFileSize = 1024 * 1024 * 10, // 10 MB
}: ImageUploaderProps<FormData>) => {
  const error = errors?.[id]?.message as string | undefined

  const [photoInitCount, setphotoInitCount] = useState(photoInit?.length ?? 0)
  const [previewUrls, setPreviewUrls] = useState<(PreviewUrl | null)[]>(
    photoInit || []
  )
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  const onFileUploadChange = (fileInput: FileList | null) => {
    if (!fileInput || fileInput.length === 0) {
      return
    }

    // Filter out files
    const newFiles: File[] = Array.from(fileInput)
      .filter(file => file.type.startsWith('image') && file.size <= maxFileSize)
      .slice(0, maxPhotos - previewUrls.length)

    // Create new url previews
    const newPreviewUrls = newFiles.map(file => {
      return { url: URL.createObjectURL(file) }
    })

    // Transfer those photos back to FileList
    const dt = new DataTransfer()
    newFiles.forEach((file: File) => dt.items.add(file))

    registerPhoto(dt.files)
    setPreviewUrls(prevPreviewUrls => [...prevPreviewUrls, ...newPreviewUrls])
  }

  const onRemoveImage = (index: number) => {
    const deletedPreviewUrl = previewUrls[index]
    if (deletedPreviewUrl?.index && removeExistingPhoto) {
      removeExistingPhoto(deletedPreviewUrl.index)
      setphotoInitCount(photoInitCount => photoInitCount - 1)
    } else {
      removeNewPhoto(index - photoInitCount)
    }
    setPreviewUrls(prevPreviewUrls =>
      prevPreviewUrls.filter((_, i) => i !== index)
    )
  }

  const openPhotoModal = (index: number) => {
    setCurrentPhotoIndex(index)
    setShowPhotoModal(true)
  }

  return (
    <>
      <Label id={id} label={label} />
      {secondaryLabel && <p className="text-muted">{secondaryLabel}</p>}
      <div className="row mb-2 smj-file-upload">
        <input
          type="file"
          disabled={previewUrls.length >= maxPhotos}
          multiple={multiple}
          id="upload-photo"
          onChange={e => onFileUploadChange(e.target.files)}
        />
      </div>
      <div className="d-inline-flex gap-2 flex-wrap align-items-center">
        {previewUrls.map((url, index) => (
          <React.Fragment key={index}>
            {url && (
              <div className="d-flex shadow bg-white rounded border p-3 pt-2 mb-2">
                <div className="container p-0 m-0">
                  <div className="pb-2 pt-1">
                    <div className="d-flex justify-content-end">
                      <i
                        className="fa-solid fa-circle-xmark smj-action-delete smj-photo-icon-delete cursor-pointer"
                        title="Odstranit"
                        onClick={e => {
                          e.stopPropagation()
                          onRemoveImage(index)
                        }}
                      ></i>
                    </div>
                  </div>
                  <div className="d-inline-flex gap-2 flex-wrap align-items-center">
                    <div
                      className="smj-photo-size"
                      style={{
                        position: 'relative',
                        cursor: 'zoom-in',
                      }}
                    >
                      <Image
                        style={{ objectFit: 'contain' }}
                        alt={`Fotografie ${index + 1}`}
                        src={url.url}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        loading="eager"
                        priority
                        onClick={() => openPhotoModal(index)}
                        onMouseDown={e => {
                          // open image in new tab with middle mouse click
                          if (e.button === 1) {
                            window.open(url.url)
                          }
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
            <label
              className="cursor-pointer smj-photo-size"
              htmlFor="upload-photo"
            >
              <svg
                className="m-4"
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

      {showPhotoModal &&
        currentPhotoIndex !== null &&
        previewUrls[currentPhotoIndex] && (
          <PhotoModal
            photo={previewUrls[currentPhotoIndex]?.url as string}
            onClose={() => setShowPhotoModal(false)}
          />
        )}
      <FormWarning message={error} />
    </>
  )
}
