import prisma from 'lib/prisma/connection'
import {
  TShirtColorComplete,
  TShirtColorCreateData,
  TShirtColorUpdateData,
} from 'lib/types/t-shirt-color'
import { reorderByIds } from './reorder-utils'

export async function getTShirtColorById(
  id: string
): Promise<TShirtColorComplete | null> {
  return prisma.tShirtColor.findFirst({
    where: { id },
  })
}

export async function getTShirtColors() {
  return prisma.tShirtColor.findMany({
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
  })
}

export async function updateTShirtColor(
  id: string,
  data: TShirtColorUpdateData
) {
  await prisma.tShirtColor.update({
    where: { id },
    data: {
      name: data.name,
      order: data.order,
    },
  })
}

export async function createTShirtColor(data: TShirtColorCreateData) {
  const last = await prisma.tShirtColor.findFirst({
    orderBy: { order: 'desc' },
    select: { order: true },
  })
  return prisma.tShirtColor.create({
    data: {
      name: data.name,
      order: last ? last.order + 1 : 0,
    },
  })
}

export async function deleteTShirtColor(id: string) {
  await prisma.tShirtColor.delete({
    where: { id },
  })
}

export async function reorderTShirtColors(orderedIds: string[]) {
  await reorderByIds(prisma.tShirtColor, orderedIds, 'Barva neexistuje.')
}
