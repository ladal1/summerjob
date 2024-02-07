import type { NextApiRequest } from 'next'
import mime from 'mime'
import formidable from 'formidable'
import path from 'path'

export const FormidableError = formidable.errors.FormidableError

export function parseForm(req: NextApiRequest) {
  return new Promise<{ fields: formidable.Fields; files: formidable.Files }>((resolve, reject) => {
    const form = formidable({})
    form.parse(req, (err, fields, files) => {
      if (err) reject({ err })
      resolve({ fields, files })
    })
  })
}

const uploadDir = path.resolve(process.cwd() + '/../') + (process.env.UPLOAD_DIR || '/web-storage')

export const parseFormJsonFile = async (
  req: NextApiRequest,
): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
  return await new Promise(async (resolve, reject) => {
    const form = formidable({
      maxFiles: 1,
      maxFileSize: 1024 * 1024 * 1, 
      uploadDir,
      filename: (_name, _ext, part) => {
        const filename = `${req.query.id as string}.${
          mime.getExtension(part.mimetype || '') || 'unknown'
        }`
        return filename
      },
      filter: part => {
        return (
          part.mimetype?.includes('json') || false
        )
      },
    })
    
    form.parse(req, function (err, fields, files) {
      if (err) reject(err)
      else resolve({ fields, files })
    })
  })
}


export const parseFormWithSingleImage = async (
  req: NextApiRequest,
): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
    return await new Promise(async (resolve, reject) => {
    const form = formidable({
      maxFiles: 2,
      maxFileSize: 1024 * 1024 * 10, 
      maxTotalFileSize: 1024 * 1024 * 11, // 10mb picture + 1mb json
      uploadDir,
      filename: (_name, _ext, part) => {
        const filename = `${req.query.id as string}.${
          mime.getExtension(part.mimetype || '') || 'unknown'
        }`
        return filename
      },
      filter: part => {
        return (
          part.mimetype?.includes('image') || part.mimetype?.includes('json') || false
        )
      },
    })

    form.parse(req, function (err, fields, files) {
      if (err) reject(err)
      else resolve({ fields, files })
    })
  })
}
