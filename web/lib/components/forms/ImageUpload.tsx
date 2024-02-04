import { ChangeEvent, useState } from 'react'
import { FieldErrors, FieldValues, Path, UseFormRegister, UseFormSetValue } from 'react-hook-form'
import FormWarning from './FormWarning'
import { Label } from './input/Label'
import Image from 'next/image'

interface ImageUploaderProps<FormData extends FieldValues> {
  id: Path<FormData>
  photoPath?: string | null
  errors: FieldErrors<FormData>
  register: UseFormRegister<FormData>
  removePhoto: () => void
}

export const ImageUploader = <FormData extends FieldValues> ({
  id,
  photoPath = null,
  errors,
  register,
  removePhoto
}: ImageUploaderProps<FormData>) => {

  const error = errors?.[id]?.message as string | undefined

  const [previewUrl, setPreviewUrl] = useState<string | null>(photoPath)
  
  const onFileUploadChange = (e: ChangeEvent<HTMLInputElement>) => {
    const fileInput = e.target

    if (!fileInput.files || fileInput.files.length === 0) {
      setPreviewUrl(null)
      return
    }

    const file = fileInput.files[0]

    /** File validation */
    if (!file.type.startsWith('image')) {
      setPreviewUrl(null)
      return
    }

    /** Setting file state */
    setPreviewUrl(URL.createObjectURL(file)) // we will use this to show the preview of the image
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
      <div className="mb-2">
        <label 
          id="workerImage" 
          className="shadow bg-white rounded border p-3 pt-2"
        >
          {previewUrl && (
            <div className="d-flex justify-content-end mb-2">
              <button
                className="btn btn-light p-2 pt-1 pb-1"
                onClick={onRemoveImage}
              >
                <i className="fa-regular fa-circle-xmark smj-action-delete" />
              </button>
            </div>
          )}
          <div className="mb-2 d-flex justify-content-center cursor-pointer">
            {previewUrl ? ( 
              <Image
                className="photo-uploaded"
                alt="Fotografie"
                src={previewUrl}
                width={320}
                height={320}
                loading="eager"
                key={Date.now()}
              />    
            ) : (
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
            )}
          </div>
          <div>
            <input
              className="block w-0 h-0"
              type="file"
              {...register(id)} // we will use the file state, to send it later to the server
              onChange={onFileUploadChange}
            />
          </div>
        </label>
      </div>
      
      <FormWarning message={error} />
    </>
  )
}
