import prisma from 'lib/prisma/connection'
import {
  ToolNameComplete,
  ToolNameCreateData,
  ToolNameUpdateData,
} from 'lib/types/tool-name'

export async function getToolNameById(
  id: string
): Promise<ToolNameComplete | null> {
  const toolName = await prisma.toolName.findFirst({
    where: {
      id,
    },
    include: {
      skills: true,
      jobTypes: true,
    },
  })
  return toolName
}

export async function getToolNames() {
  const toolNames = await prisma.toolName.findMany({
    include: {
      skills: true,
      jobTypes: true,
    },
  })
  return toolNames
}

export async function updateToolName(
  toolNameId: string,
  toolName: ToolNameUpdateData
) {
  const skillUpdate = {
    ...(toolName.skills && {
      skills: { set: toolName.skills.map(id => ({ id })) },
    }),
  }
  const jobTypeUpdate = {
    ...(toolName.jobTypes && {
      jobTypes: { set: toolName.jobTypes.map(id => ({ id })) },
    }),
  }

  await prisma.toolName.update({
    where: {
      id: toolNameId,
    },
    data: {
      name: toolName.name,
      ...skillUpdate,
      ...jobTypeUpdate,
    },
  })
}

export async function createToolName(toolNameData: ToolNameCreateData) {
  const toolName = await prisma.toolName.create({
    data: {
      name: toolNameData.name,
      skills: {
        connect: toolNameData.skills?.map(id => ({ id })) ?? [],
      },
      jobTypes: {
        connect: toolNameData.jobTypes?.map(id => ({ id })) ?? [],
      },
    },
  })
  return toolName
}

export async function deleteToolName(toolNameId: string) {
  await prisma.toolName.delete({
    where: {
      id: toolNameId,
    },
  })
}
