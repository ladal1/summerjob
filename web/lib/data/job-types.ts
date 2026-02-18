import prisma from 'lib/prisma/connection'
import {
  JobTypeComplete,
  JobTypeCreateData,
  JobTypeUpdateData,
} from 'lib/types/job-type'

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
  const jobTypes = await prisma.jobType.findMany()
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
  const jobType = await prisma.jobType.create({
    data: {
      name: jobTypeData.name,
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
