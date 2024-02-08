import type { NextApiRequest } from 'next'
import mime from 'mime'
import formidable from 'formidable'
export const FormidableError = formidable.errors.FormidableError

/* Get simple data from string jsonData containing json data. */
const getJson = (
  fieldsJsonData: string | string[]
): string => {
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
): Promise<{ fields: formidable.Fields; files: formidable.Files; json: string }> => {
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
): Promise<{ fields: formidable.Fields; files: formidable.Files; json: string }> => {
    return await new Promise(async (resolve, reject) => {
    const form = formidable({
      maxFiles: 1,
      maxTotalFileSize: 1024 * 1024 * 10, // 10mb picture
      uploadDir,
      filename: (_name, _ext, part) => {
        const filename = `${nameOfImage}.${mime.getExtension(part.mimetype || '') || 'unknown'}`
        return filename
      },
      filter: part => {
        return (
          part.mimetype?.includes('image') || false
        )
      },
    })

    form.parse(req, function (err, fields, files) {
      if (err) reject(err)
      const json = getJson(fields.jsonData)
      resolve({ fields, files, json })
    })
  })
}
