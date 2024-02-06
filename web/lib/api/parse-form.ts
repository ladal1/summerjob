import type { NextApiRequest } from 'next'
import mime from 'mime'
import formidable from 'formidable'
import { mkdir, stat } from 'fs/promises'
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

export async function parseFormWithSingleImage(req: NextApiRequest, uploadDir: string) {
  return await new Promise<{ fields: formidable.Fields; files: formidable.Files, fileName: string }>(async (resolve, reject) => {
    let fileName = "" 
    const form = formidable({
      maxFiles: 1,
      maxFileSize: 1024 * 1024 * 10, // 10mb
      uploadDir,
      filename: (_name, _ext, part) => {
        const filename = `${req.query.id as string}.${
          mime.getExtension(part.mimetype || '') || 'unknown'
        }`
        fileName = filename
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
      else resolve({ fields, files, fileName })
    })
  })
}
