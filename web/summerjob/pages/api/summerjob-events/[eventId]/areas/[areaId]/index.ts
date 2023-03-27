import { http_method_handler } from "lib/api/method_handler";
import { validateOrSendError } from "lib/api/validator";
import { deleteArea, updateArea } from "lib/data/areas";
import { AreaUpdateData, AreaUpdateSchema } from "lib/types/area";
import { NextApiRequest, NextApiResponse } from "next";

async function del(req: NextApiRequest, res: NextApiResponse) {
  const id = req.query.areaId as string;
  await deleteArea(id);
  res.status(204).end();
}

export type AreaAPIPatchData = AreaUpdateData;
async function patch(req: NextApiRequest, res: NextApiResponse) {
  const data = validateOrSendError(AreaUpdateSchema, req.body, res);
  if (!data) {
    return;
  }
  const id = req.query.areaId as string;
  await updateArea(id, data);
  res.status(204).end();
}

export default http_method_handler({ patch: patch, del: del });