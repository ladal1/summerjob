import { APIAccessController } from "lib/api/APIAccessControler";
import { APIMethodHandler } from "lib/api/MethodHandler";
import { NextApiRequest, NextApiResponse } from "next";
import { Allergy } from "../../../lib/prisma/client";

export type AllergiesAPIGetResponse = string[];
async function get(
  req: NextApiRequest,
  res: NextApiResponse<AllergiesAPIGetResponse>
) {
  const allergies = Object.values(Allergy);
  res.status(200).json(allergies);
}

export default APIAccessController([], APIMethodHandler({ get }));
