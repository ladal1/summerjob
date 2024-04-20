import { Tool } from 'lib/prisma/client'
import prisma from 'lib/prisma/connection'
import { PhotoIdsData } from 'lib/types/photo'
import {
  ProposedJobCreateData,
  type ProposedJobComplete,
  type ProposedJobUpdateData,
} from 'lib/types/proposed-job'
import { cache_getActiveSummerJobEventId } from './cache'
import { NoActiveEventError } from './internal-error'
import {
  createTools,
  deleteTools,
  registerTools,
  ToolType,
  updateTools,
} from './tools'
import formidable from 'formidable'
import { PrismaClient } from '@prisma/client'
import { PrismaTransactionClient } from 'lib/types/prisma'
import { deleteAllPhotos, registerPhotos } from './jobPhoto'

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
  id: string,
  prismaClient: PrismaClient | PrismaTransactionClient = prisma
): Promise<PhotoIdsData | null> {
  const activeEventId = await cache_getActiveSummerJobEventId()
  if (!activeEventId) {
    throw new NoActiveEventError()
  }
  const photos = await prismaClient.proposedJob.findUnique({
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
  return photos
}

export async function hasProposedJobPhotos(
  id: string,
  prismaClient: PrismaClient | PrismaTransactionClient = prisma
): Promise<boolean> {
  const photoIds = await getProposedJobPhotoIdsById(id, prismaClient)
  return photoIds?.photos.length !== 0
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
  proposedJobData: ProposedJobUpdateData,
  files: formidable.Files
) {
  const activeEventId = await cache_getActiveSummerJobEventId()
  if (!activeEventId) {
    throw new NoActiveEventError()
  }
  const {
    allergens,
    pinnedByChange,
    toolsOnSite,
    toolsOnSiteIdsDeleted,
    toolsOnSiteUpdated,
    toolsToTakeWith,
    toolsToTakeWithIdsDeleted,
    toolsToTakeWithUpdated,
    photoIdsDeleted,
    ...rest
  } = proposedJobData
  const allergyUpdate = allergens ? { allergens: { set: allergens } } : {}

  const updated = await prisma.$transaction(async tx => {
    // Update pinned
    if (pinnedByChange !== undefined && !pinnedByChange.pinned) {
      await tx.pinnedProposedJobByWorker.delete({
        where: {
          workerId_jobId: { workerId: pinnedByChange.workerId, jobId: id },
        },
      })
    }
    // Update job
    const proposedJob = await tx.proposedJob.update({
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
    // Update job's tools
    await registerTools(
      toolsOnSite,
      toolsOnSiteUpdated,
      toolsOnSiteIdsDeleted,
      proposedJob.id,
      ToolType.ON_SITE,
      tx
    )
    await registerTools(
      toolsToTakeWith,
      toolsToTakeWithUpdated,
      toolsToTakeWithIdsDeleted,
      proposedJob.id,
      ToolType.TO_TAKE_WITH,
      tx
    )
    // Update job's photos
    await registerPhotos(files, photoIdsDeleted, proposedJob.id, tx)
    return proposedJob
  })
  return updated
}

export async function createProposedJob(
  data: ProposedJobCreateData,
  files: formidable.Files
) {
  const { toolsOnSite, toolsToTakeWith, ...rest } = data

  const created = await prisma.$transaction(async tx => {
    // Create job
    const proposedJob = await tx.proposedJob.create({
      data: { ...rest },
    })
    // Create job's tools
    await registerTools(
      toolsOnSite,
      undefined,
      undefined,
      proposedJob.id,
      ToolType.ON_SITE,
      tx
    )
    await registerTools(
      toolsToTakeWith,
      undefined,
      undefined,
      proposedJob.id,
      ToolType.TO_TAKE_WITH,
      tx
    )
    // Create job's photos
    await registerPhotos(files, undefined, proposedJob.id, tx)
    return proposedJob
  })
  return created
}

export async function deleteProposedJob(id: string) {
  await prisma.$transaction(async tx => {
    await tx.pinnedProposedJobByWorker.deleteMany({
      where: {
        jobId: id,
      },
    })
    await tx.proposedJob.delete({
      where: {
        id,
      },
    })
    await deleteAllPhotos(id, tx)
  })
}
