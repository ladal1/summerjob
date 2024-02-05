import { useDataFilePartialUpdate } from "./fetcher-file"
import { PhotoAPIPatchData } from "pages/api/workers/[id]/photo"

export function useAPIWorkerUpdatePhoto(workerId: string, options?: any) {
  return useDataFilePartialUpdate<PhotoAPIPatchData>(
    `/api/workers/${workerId}/image`,
    options
  )
}