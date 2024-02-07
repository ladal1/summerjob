import { promises } from "fs"
import { getWorkerById } from "lib/data/workers"

import crypto from "crypto"

export const generateFileName = (): string => {
  return crypto.randomBytes(30).toString('hex') 
}

export const deleteOriginalImage = async (
  workersId: string,
  newPhotoPath: string
) => {
  const worker = await getWorkerById(workersId) // FIXME: return specifically only photoPath
  if(worker?.photoPath && worker.photoPath !== newPhotoPath) { // if original image exists and it is named differently (meaning it wasn't replaced already by parseFormWithSingleImage) delete it 
    await promises.unlink(worker.photoPath) // delete replaced/original image
  }
} 