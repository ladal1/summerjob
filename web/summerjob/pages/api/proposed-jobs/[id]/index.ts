import { APIAccessController } from "lib/api/APIAccessControler";
import { APIMethodHandler } from "lib/api/MethodHandler";
import { validateOrSendError } from "lib/api/validator";
import { deleteProposedJob, updateProposedJob } from "lib/data/proposed-jobs";
import logger from "lib/logger/logger";
import { ExtendedSession, Permission } from "lib/types/auth";
import { APILogEvent } from "lib/types/logger";
import {
  ProposedJobUpdateSchema,
  ProposedJobUpdateDataInput,
} from "lib/types/proposed-job";
import { NextApiRequest, NextApiResponse } from "next";

export type ProposedJobAPIPatchData = ProposedJobUpdateDataInput;
async function patch(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const id = req.query.id as string;
  const proposedJobData = validateOrSendError(
    ProposedJobUpdateSchema,
    req.body,
    res
  );
  if (!proposedJobData) {
    return;
  }
  await logger.apiRequest(APILogEvent.JOB_MODIFY, req.body, session);
  await updateProposedJob(id, proposedJobData);
  res.status(204).end();
}

async function del(
  req: NextApiRequest,
  res: NextApiResponse,
  session: ExtendedSession
) {
  const id = req.query.id as string;
  await logger.apiRequest(APILogEvent.JOB_DELETE, req.body, session);
  await deleteProposedJob(id);
  res.status(204).end();
}

export default APIAccessController(
  [Permission.JOBS],
  APIMethodHandler({ patch, del })
);
