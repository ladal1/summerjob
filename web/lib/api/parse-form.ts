import type { NextApiRequest, NextApiResponse } from 'next'
import mime from 'mime'
import formidable from 'formidable'
import { createDirectory, deleteFile } from './fileManager'
import { ApiBadRequestError } from 'lib/types/api-error'
import path from 'path'

/* Get simple data from string jsonData containing json data. */
const getJson = (fieldsJsonData: string | string[] | undefined): unknown => {
  if (!fieldsJsonData) {
    return null
  }
  const jsonData = Array.isArray(fieldsJsonData)
    ? fieldsJsonData[0]
    : fieldsJsonData
  let json
  try {
    json = JSON.parse(jsonData)
  } catch (error) {
    console.log(error)
  }
  return json
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
  req: NextApiRequest
): Promise<{
  fields: formidable.Fields
  files: formidable.Files
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json: any
}> => {
  return await new Promise(async (resolve, reject) => {
    const form = formidable({})
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject({ err })
        return
      }
      const json = getJson(fields.jsonData)
      resolve({ fields, files, json })
    })
  })
}

export const parseFormWithImages = async (
  req: NextApiRequest,
  res: NextApiResponse,
  nameOfImage: string,
  uploadDir: string,
  maxFiles: number
): Promise<{
  fields: formidable.Fields
  files: formidable.Files
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json: any
}> => {
  await createDirectory(uploadDir)
  let count = 0
  const uploadedFiles: string[] = []
  const form = formidable({
    maxFiles: maxFiles,
    maxFileSize: 1024 * 1024 * 10,
    maxTotalFileSize: 1024 * 1024 * 10 * maxFiles, // 10 MB a picture
    uploadDir,
    filename: (_name, _ext, part) => {
      let filename = ''
      if (maxFiles > 1) {
        filename = `${nameOfImage}-${count}.${
          mime.getExtension(part.mimetype || '') || 'unknown'
        }`
        count = count + 1
      } else {
        filename = `${nameOfImage}.${
          mime.getExtension(part.mimetype || '') || 'unknown'
        }`
      }
      uploadedFiles.push(filename)
      return filename
    },
    filter: part => {
      if (!part.mimetype?.includes('image')) {
        res.status(400).json({
          error: new ApiBadRequestError(
            'Invalid file type - only images are allowed.'
          ),
        })
        return false
      }
      return true
    },
  })
  return await new Promise(async resolve => {
    form.parse(req, async function (err, fields, files) {
      if (err) {
        for (const file of uploadedFiles) {
          try {
            await deleteFile(path.resolve(uploadDir, file))
          } catch {}
        }
        res.status(err.httpCode).json({
          error: new ApiBadRequestError(
            'Type: ' + err.type + '\nMessage: ' + err.message
          ),
        })
        return
      }
      const json = getJson(fields.jsonData)
      resolve({ fields, files, json })
    })
  })
}
