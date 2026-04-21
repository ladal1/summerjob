/* eslint-disable @typescript-eslint/no-explicit-any */

import prisma from 'lib/prisma/connection'
import { InvalidDataError } from './internal-error'

type ReorderableModel = {
  findMany: (args: any) => Promise<Array<{ id: string }>>
  update: (args: any) => any
}

export async function reorderByIds(
  model: ReorderableModel,
  orderedIds: string[],
  notFoundMessage: string
) {
  const existing = await model.findMany({
    where: { id: { in: orderedIds } },
    select: { id: true },
  })
  if (existing.length !== orderedIds.length) {
    throw new InvalidDataError(notFoundMessage)
  }
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      model.update({ where: { id }, data: { order: index } })
    )
  )
}
