import type { NextApiRequest } from 'next'
import mime from 'mime'
import formidable from 'formidable'
import { mkdir, stat } from 'fs/promises'

export const FormidableError = formidable.errors.FormidableError

export const parseForm = async (
  req: NextApiRequest
): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
  return await new Promise(async (resolve, reject) => {
    const uploadDir = process.env.UPLOAD_DIR || '/web-storage'

    try {
      await stat(uploadDir)
    } catch (e: any) {
      if (e.code === 'ENOENT') {
        await mkdir(uploadDir, { recursive: true })
      } else {
        reject(e)
        return
      }
    }

    const form = formidable({
      maxFiles: 1,
      maxFileSize: 1024 * 1024 * 10, // 10mb
      uploadDir,
      filename: (_name, _ext, part) => {
        const filename = `${req.query.id as string}.${
          mime.getExtension(part.mimetype || '') || 'unknown'
        }`
        return filename
      },
      filter: part => {
        return (
          part.name === 'image' && (part.mimetype?.includes('image') || false)
        )
      },
    })

    form.parse(req, function (err, fields, files) {
      if (err) reject(err)
      else resolve({ fields, files })
    })
  })
}
