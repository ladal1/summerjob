import prisma from 'lib/prisma/connection'
import {
  JobTypeComplete,
  JobTypeCreateData,
  JobTypeUpdateData,
} from 'lib/types/job-type'
import { reorderByIds } from './reorder-utils'

export async function getJobTypeById(
  id: string
): Promise<JobTypeComplete | null> {
  const jobType = await prisma.jobType.findFirst({
    where: {
      id,
    },
  })
  return jobType
}

export async function getJobTypes() {
  const jobTypes = await prisma.jobType.findMany({
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
  })
  return jobTypes
}

export async function updateJobType(
  jobTypeId: string,
  jobType: JobTypeUpdateData
) {
  await prisma.jobType.update({
    where: {
      id: jobTypeId,
    },
    data: {
      name: jobType.name,
    },
  })
}

export async function createJobType(jobTypeData: JobTypeCreateData) {
  const last = await prisma.jobType.findFirst({
    orderBy: { order: 'desc' },
    select: { order: true },
  })
  const jobType = await prisma.jobType.create({
    data: {
      name: jobTypeData.name,
      order: last ? last.order + 1 : 0,
    },
  })
  return jobType
}

export async function deleteJobType(jobTypeId: string) {
  await prisma.jobType.delete({
    where: {
      id: jobTypeId,
    },
  })
}

export async function reorderJobTypes(orderedIds: string[]) {
  await reorderByIds(prisma.jobType, orderedIds, 'Typ práce neexistuje.')
}
