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
import { createTools, deleteTools, updateTools } from './tools'

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
  const {
    allergens,
    pinnedByChange,
    toolsOnSite,
    toolsOnSiteIdsDeleted,
    toolsOnSiteUpdated,
    toolsToTakeWith,
    toolsToTakeWithIdsDeleted,
    toolsToTakeWithUpdated,
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
    // Delete job's tools
    if (toolsOnSiteIdsDeleted !== undefined) {
      await deleteTools(toolsOnSiteIdsDeleted, tx)
    }
    if (toolsToTakeWithIdsDeleted !== undefined) {
      await deleteTools(toolsToTakeWithIdsDeleted, tx)
    }
    // Create job's tools
    let onSite: Tool[] = []
    let takeWith: Tool[] = []
    if (toolsOnSite && toolsOnSite.tools) {
      const tools = {
        tools: toolsOnSite.tools.map(toolItem => ({
          ...toolItem,
          proposedJobOnSiteId: proposedJob.id,
        })),
      }
      onSite = await createTools(tools, tx)
    }
    if (toolsToTakeWith && toolsToTakeWith.tools) {
      const tools = {
        tools: toolsToTakeWith.tools.map(toolItem => ({
          ...toolItem,
          proposedJobToTakeWithId: proposedJob.id,
        })),
      }
      takeWith = await createTools(tools, tx)
    }
    // Update job's tools
    let onSiteUpdated: Tool[] = []
    let toTakeWithUpdated: Tool[] = []
    if (toolsOnSiteUpdated && toolsOnSiteUpdated.tools) {
      const tools = toolsOnSiteUpdated.tools
        .filter(
          toolItem =>
            toolItem.id && !toolsOnSiteIdsDeleted?.includes(toolItem.id)
        )
        .map(toolItem => ({
          ...toolItem,
          proposedJobOnSiteId: proposedJob.id,
        }))
      onSiteUpdated = await updateTools({ tools }, tx)
    }
    if (toolsToTakeWithUpdated && toolsToTakeWithUpdated.tools) {
      const tools = toolsToTakeWithUpdated.tools
        .filter(
          toolItem =>
            toolItem.id && !toolsOnSiteIdsDeleted?.includes(toolItem.id)
        )
        .map(toolItem => ({
          ...toolItem,
          proposedJobToTakeWithId: proposedJob.id,
        }))
      toTakeWithUpdated = await updateTools({ tools }, tx)
    }
    return {
      ...proposedJob,
      toolsOnSite: onSite,
      toolsToTakeWith: takeWith,
      toolsOnSiteUpdated: onSiteUpdated,
      toolsToTakeWithUpdated: toTakeWithUpdated,
    }
  })
  return updated
}

export async function createProposedJob(data: ProposedJobCreateData) {
  const { toolsOnSite, toolsToTakeWith, ...rest } = data

  const created = await prisma.$transaction(async tx => {
    // Create job
    const proposedJob = await tx.proposedJob.create({
      data: { ...rest },
    })
    // Create job's tools
    let onSite: Tool[] = []
    let takeWith: Tool[] = []
    if (toolsOnSite && toolsOnSite.tools) {
      const tools = {
        tools: toolsOnSite.tools.map(toolItem => ({
          ...toolItem,
          proposedJobOnSiteId: proposedJob.id,
        })),
      }
      onSite = await createTools(tools, tx)
    }
    if (toolsToTakeWith && toolsToTakeWith.tools) {
      const tools = {
        tools: toolsToTakeWith.tools.map(toolItem => ({
          ...toolItem,
          proposedJobToTakeWithId: proposedJob.id,
        })),
      }
      takeWith = await createTools(tools, tx)
    }
    return { ...proposedJob, toolsOnSite: onSite, toolsToTakeWith: takeWith }
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
  })
}
