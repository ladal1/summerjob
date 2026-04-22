import prisma from 'lib/prisma/connection'
import {
  TShirtSizeComplete,
  TShirtSizeCreateData,
  TShirtSizeUpdateData,
} from 'lib/types/t-shirt-size'
import { reorderByIds } from './reorder-utils'

export async function getTShirtSizeById(
  id: string
): Promise<TShirtSizeComplete | null> {
  return prisma.tShirtSize.findFirst({
    where: { id },
  })
}

export async function getTShirtSizes() {
  return prisma.tShirtSize.findMany({
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
  })
}

export async function updateTShirtSize(id: string, data: TShirtSizeUpdateData) {
  await prisma.tShirtSize.update({
    where: { id },
    data: {
      name: data.name,
      order: data.order,
    },
  })
}

export async function createTShirtSize(data: TShirtSizeCreateData) {
  const last = await prisma.tShirtSize.findFirst({
    orderBy: { order: 'desc' },
    select: { order: true },
  })
  return prisma.tShirtSize.create({
    data: {
      name: data.name,
      order: last ? last.order + 1 : 0,
    },
  })
}

export async function deleteTShirtSize(id: string) {
  await prisma.tShirtSize.delete({
    where: { id },
  })
}

export async function reorderTShirtSizes(orderedIds: string[]) {
  await reorderByIds(prisma.tShirtSize, orderedIds, 'Velikost neexistuje.')
}
