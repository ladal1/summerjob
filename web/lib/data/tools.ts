import { Tool, PrismaClient } from 'lib/prisma/client'
import prisma from 'lib/prisma/connection'
import { PrismaTransactionClient } from 'lib/types/prisma'
import {
  ToolCreateData,
  ToolUpdateData,
  ToolsCreateData,
  ToolsUpdateData,
} from 'lib/types/tool'

export async function createTools(
  data: ToolsCreateData,
  prismaClient: PrismaClient | PrismaTransactionClient = prisma
) {
  const tools: Tool[] = []
  for (const tool of data.tools) {
    tools.push(await createTool(tool, prismaClient))
  }
  return tools
}

export async function createTool(
  data: ToolCreateData,
  prismaClient: PrismaClient | PrismaTransactionClient = prisma
) {
  const tool = await prismaClient.tool.create({
    data: data,
  })
  return tool
}

export async function updateTools(
  data: ToolsUpdateData,
  prismaClient: PrismaClient | PrismaTransactionClient = prisma
) {
  const tools: Tool[] = []
  if (data.tools) {
    for (const tool of data.tools) {
      tools.push(await updateTool(tool, prismaClient))
    }
  }
  return tools
}

export async function updateTool(
  data: ToolUpdateData,
  prismaClient: PrismaClient | PrismaTransactionClient = prisma
) {
  const { id, ...rest } = data
  const tools = await prismaClient.tool.update({
    where: {
      id,
    },
    data: rest,
  })
  return tools
}

export async function deleteTools(
  ids: string[],
  prismaClient: PrismaClient | PrismaTransactionClient = prisma
) {
  for (const id of ids) {
    await deleteTool(id, prismaClient)
  }
}

export async function deleteTool(
  id: string,
  prismaClient: PrismaClient | PrismaTransactionClient = prisma
) {
  await prismaClient.tool.delete({
    where: {
      id,
    },
  })
}
