import { Tool, PrismaClient } from 'lib/prisma/client'
import prisma from 'lib/prisma/connection'
import { PrismaTransactionClient } from 'lib/types/prisma'
import { ToolCreateData, ToolsCreateData } from 'lib/types/tool'

export async function createTools(data: ToolsCreateData) {
  const tools = await prisma.$transaction(async tx => {
    const tools: Tool[] = []
    for (const tool of data.tools) {
      tools.push(await createTool(tool, tx))
    }
    return tools
  })
  return tools
}

export async function createTool(
  data: ToolCreateData,
  prismaClient: PrismaClient | PrismaTransactionClient = prisma
) {
  const proposedJob = await prismaClient.tool.create({
    data: data,
  })
  return proposedJob
}