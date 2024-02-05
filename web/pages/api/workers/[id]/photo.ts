import { APIMethodHandler } from "lib/api/MethodHandler"
import { PhotoUpdateDataInput } from "lib/types/photo"
import { NextApiRequest, NextApiResponse } from "next"

export type PhotoAPIPatchData = PhotoUpdateDataInput
async function post(req: NextApiRequest, res: NextApiResponse) {
  console.log(req)
  res.status(204)
}

export default APIMethodHandler({ post })