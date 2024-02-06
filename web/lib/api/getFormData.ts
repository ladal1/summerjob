import formidable from "formidable";
import { NextApiRequest } from "next";

export function getFormData(req: NextApiRequest) {
  return new Promise<{ fields?: formidable.Fields; files?: formidable.Files }>((resolve, reject) => {
    const form = new formidable.IncomingForm()
    form.parse(req, (err, fields, files) => {
      if (err) reject({ err })
      resolve({ fields, files })
    })
  })
}

