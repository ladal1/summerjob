/* eslint-disable @next/next/no-img-element */
import { ChangeEvent } from 'react'

export default function ImageUploader({
  previewUrl,
  setPreviewUrl,
  setFile,
}: {
  previewUrl: string | null
  setPreviewUrl: (url: string | null) => void
  setFile: (file: File | null) => void
}) {
  const onFileUploadChange = (e: ChangeEvent<HTMLInputElement>) => {
    const fileInput = e.target

    if (!fileInput.files || fileInput.files.length === 0) {
      setPreviewUrl(null)
      return
    }

    const file = fileInput.files[0]

    /** File validation */
    if (!file.type.startsWith('image')) {
      alert('Please select a valid image')
      setPreviewUrl(null)
      return
    }

    /** Setting file state */
    setFile(file) // we will use the file state, to send it later to the server
    setPreviewUrl(URL.createObjectURL(file)) // we will use this to show the preview of the image
  }

  return (
    <div className="me-3 pt-4">
      <label
        id="workerImage"
        className="shadow p-3 cursor-pointer mb-5 bg-white rounded border"
        style={{ display: 'inline-grid' }}
      >
        <strong>Fotografie</strong>
        {previewUrl ? (
          <div className="mx-auto w-80">
            <img
              alt="file uploader preview"
              style={{ objectFit: 'cover', fill: 'fixed' }}
              src={previewUrl}
              width={320}
              height={320}
              loading="eager"
              key={Date.now()}
            />
          </div>
        ) : (
          <svg
            width="300px"
            height="300px"
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

        <input
          className="block w-0 h-0"
          name="file"
          type="file"
          onChange={onFileUploadChange}
        />
      </label>
    </div>
  )
}
