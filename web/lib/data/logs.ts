import { Prisma } from 'lib/prisma/client'
import prisma from 'lib/prisma/connection'
import { LogsResponse } from 'lib/types/log'
import { APILogEvent } from 'lib/types/logger'

export async function addLogEvent(
  authorId: string,
  authorName: string,
  resourceId: string,
  eventType: string,
  message: string
) {
  await prisma.logging.create({
    data: {
      authorId,
      authorName,
      resourceId,
      eventType,
      message,
    },
  })
}

type LogsSearchParams = {
  text?: string
  type?: APILogEvent
  limit?: number
  offset?: number
}
export async function getLogs({
  text,
  type,
  limit,
  offset,
}: LogsSearchParams): Promise<LogsResponse> {
  offset ??= 0
  limit ??= 5

  const whereClause = Prisma.validator<Prisma.LoggingWhereInput>()({
    AND: [
      {
        OR: [
          { authorId: { contains: text, mode: 'insensitive' } },
          { authorName: { contains: text, mode: 'insensitive' } },
          { resourceId: { contains: text, mode: 'insensitive' } },
          { message: { contains: text, mode: 'insensitive' } },
        ],
      },
      {
        eventType: {
          equals: type as string,
        },
      },
    ],
  })

  return await prisma.$transaction(async tx => {
    const logs = await tx.logging.findMany({
      where: whereClause,
      orderBy: {
        timestamp: 'desc',
      },
      skip: offset,
      take: limit,
    })
    const totalLogs = await tx.logging.count({
      where: whereClause,
    })
    return { logs, total: totalLogs }
  })
}
