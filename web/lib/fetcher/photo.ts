import { useDataFilePartialUpdate } from "./fetcher-file"
import { PhotoAPIPatchData } from "pages/api/workers/[id]/photo"

export function useAPIWorkerUpdatePhoto(workerId: string, options?: any) {
  return useDataFilePartialUpdate<PhotoAPIPatchData>(
    `/api/workers/${workerId}/image`,
    options
  )
}

const uploadFile = async () => {
  const photoFile = undefined
  console.log(photoFile)
  if (!photoFile) return
  const formData = new FormData()
  formData.append('image', photoFile[0])
  await fetch(`/api/workers/TODO/image`, {
    method: 'POST',
    body: formData,
  })
}