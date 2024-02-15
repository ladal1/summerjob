import type { NextApiRequest, NextApiResponse } from 'next'
import mime from 'mime'
import formidable from 'formidable'
import { createDirectory } from './fileManager'
import { ApiInternalServerError } from 'lib/types/api-error'
export const FormidableError = formidable.errors.FormidableError

/* Get simple data from string jsonData containing json data. */
const getJson = (
  fieldsJsonData: string | string[]
): any => {
  const jsonData = Array.isArray(fieldsJsonData)
      ? fieldsJsonData[0]
      : fieldsJsonData
  return JSON.parse(jsonData)
}

/* Get photoPath from uploaded photoFile. */
export const getPhotoPath = (
  filesPhotoFile: formidable.File | formidable.File[]
): string => {
  return Array.isArray(filesPhotoFile)
      ? filesPhotoFile[0].filepath
      : filesPhotoFile.filepath
}

export const parseForm = async (
  req: NextApiRequest,
): Promise<{ fields: formidable.Fields; files: formidable.Files; json: any }> => {
  return await new Promise(async (resolve, reject) => {
    const form = formidable({})
    form.parse(req, (err, fields, files) => {
      if (err) reject({ err })
      const json = getJson(fields.jsonData)
      resolve({ fields, files, json })
    })
  })
}

export const parseFormWithSingleImage = async (
  req: NextApiRequest,
  nameOfImage: string,
  uploadDir: string
): Promise<{ fields: formidable.Fields; files: formidable.Files; json: any }> => {
  
    createDirectory(uploadDir)
    
    return await new Promise(async (resolve, reject) => {
    const form = formidable({
      maxFiles: 1,
      maxTotalFileSize: 1024 * 1024 * 10, // 10 MB picture
      uploadDir,
      filename: (_name, _ext, part) => {
        const filename = `${nameOfImage}.${mime.getExtension(part.mimetype || '') || 'unknown'}`
        return filename
      },
      filter: part => {
        if (!part.mimetype?.includes('image')) {
          reject(new Error('Invalid file type - only images are allowed.'))
          return false
        }
        return true
      },
    })

    form.parse(req, function (err, fields, files) {
      if (err) reject(err)
      const json = getJson(fields.jsonData)
      resolve({ fields, files, json })
    })
  })
}
