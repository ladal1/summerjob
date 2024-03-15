import prisma from 'lib/prisma/connection'
import {
  ProposedJobCreateData,
  type ProposedJobComplete,
  type ProposedJobUpdateData,
} from 'lib/types/proposed-job'
import { cache_getActiveSummerJobEventId } from './cache'
import { NoActiveEventError } from './internal-error'
import { PhotoIdsData } from 'lib/types/photo'

export async function getProposedJobById(
  id: string
): Promise<ProposedJobComplete | null> {
  const activeEventId = await cache_getActiveSummerJobEventId()
  if (!activeEventId) {
    throw new NoActiveEventError()
  }
  const job = await prisma.proposedJob.findUnique({
    where: {
      id: id,
    },
    include: {
      area: true,
      activeJobs: true,
      toolsOnSite: true,
      toolsToTakeWith: true,
      photos: true,
      pinnedBy: {
        select: {
          workerId: true,
        },
      },
    },
  })
  return job
}

export async function getProposedJobPhotoIdsById(
  id: string
): Promise<PhotoIdsData | null> {
  const activeEventId = await cache_getActiveSummerJobEventId()
  if (!activeEventId) {
    throw new NoActiveEventError()
  }
  const jobs = await prisma.proposedJob.findUnique({
    where: {
      id: id,
    },
    select: {
      photos: {
        select: {
          id: true,
        },
      },
    },
  })
  return jobs
}

export async function hasProposedJobPhotos(id: string): Promise<boolean> {
  const jobs = await getProposedJobPhotoIdsById(id)
  return jobs?.photos?.length !== 0
}

export async function getProposedJobs(): Promise<ProposedJobComplete[]> {
  const jobs = await prisma.proposedJob.findMany({
    where: {
      area: {
        summerJobEvent: {
          isActive: true,
        },
      },
    },
    include: {
      area: true,
      activeJobs: true,
      toolsOnSite: true,
      toolsToTakeWith: true,
      photos: true,
      pinnedBy: {
        select: {
          workerId: true,
        },
      },
    },
    orderBy: [
      {
        name: 'asc',
      },
    ],
  })
  return jobs
}

/**
 * Find all proposed jobs that are not already assigned to the given plan and are available on the plan's day.
 * @param planId The ID of the plan to check against.
 * @returns Proposed jobs that are not already assigned to the given plan and are available on the plan's day.
 */
export async function getProposedJobsAssignableTo(
  planId: string
): Promise<ProposedJobComplete[]> {
  const planDay = await prisma.plan.findUnique({
    where: {
      id: planId,
    },
    select: {
      day: true,
    },
  })
  const jobs = await prisma.proposedJob.findMany({
    where: {
      NOT: {
        activeJobs: {
          some: {
            planId: planId,
          },
        },
      },
      completed: false,
      hidden: false,
      availability: {
        has: planDay?.day,
      },
    },
    include: {
      area: true,
      activeJobs: true,
      toolsOnSite: true,
      toolsToTakeWith: true,
      photos: true,
      pinnedBy: {
        select: {
          workerId: true,
        },
      },
    },
    orderBy: [
      {
        name: 'asc',
      },
    ],
  })
  return jobs
}

export async function updateProposedJob(
  id: string,
  proposedJobData: ProposedJobUpdateData
) {
  const activeEventId = await cache_getActiveSummerJobEventId()
  if (!activeEventId) {
    throw new NoActiveEventError()
  }
  const { allergens, pinnedByChange, ...rest } = proposedJobData
  const allergyUpdate = allergens ? { allergens: { set: allergens } } : {}

  if (pinnedByChange !== undefined && !pinnedByChange.pinned) {
    await prisma.pinnedProposedJobByWorker.delete({
      where: {
        workerId_jobId: { workerId: pinnedByChange.workerId, jobId: id },
      },
    })
  }

  const proposedJob = await prisma.proposedJob.update({
    where: {
      id,
    },
    data: {
      pinnedBy: {
        ...(pinnedByChange?.pinned && {
          create: {
            worker: {
              connect: {
                id: pinnedByChange.workerId,
              },
            },
          },
        }),
      },
      ...rest,
      ...allergyUpdate,
    },
  })
  return proposedJob
}

export async function createProposedJob(data: ProposedJobCreateData) {
  const proposedJob = await prisma.proposedJob.create({
    data: data,
  })
  return proposedJob
}

export async function deleteProposedJob(id: string) {
  await prisma.proposedJob.delete({
    where: {
      id,
    },
  })
}
